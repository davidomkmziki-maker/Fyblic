(function(){
  "use strict";

  if(window.__HAPPYAD_SETTINGS_ACCOUNT_AUTH_V855R48__)return;
  window.__HAPPYAD_SETTINGS_ACCOUNT_AUTH_V855R48__=true;

  var VERSION="855r48-account-lifecycle-region";
  var SETTINGS_TABLE="happyad_user_settings";
  var OTP_TTL_MS=10*60*1000;
  var MAX_LOCAL_ATTEMPTS=5;
  var challenges=new Map();
  var reauthChallenges=new Map();
  var reauthTokens=new Map();
  var authenticatorEnrollments=new Map();
  var REAUTH_TTL_MS=10*60*1000;
  var activeClient=null;
  var settingsCache=null;
  var settingsCacheAt=0;

  function clean(value){return String(value==null?"":value).trim();}
  function lower(value){return clean(value).toLowerCase();}
  function same(a,b){return lower(a)===lower(b);}

  function failure(code,message,cause){
    var error=new Error(message||code||"Erreur de sécurité");
    error.code=code||"REQUEST_FAILED";
    if(cause)error.cause=cause;
    return error;
  }

  function authFailure(error){
    var code=lower(error&&error.code);
    var message=clean(error&&error.message);
    var haystack=(code+" "+message).toLowerCase();

    if(/phone_exists|email_exists|user_already_exists|already registered|already been registered|already in use/.test(haystack)){
      return failure("IDENTIFIER_ALREADY_USED","Cette coordonnée est déjà utilisée sur un autre compte Fyblic.",error);
    }
    if(/otp_expired|token has expired|expired/.test(haystack)){
      return failure("EXPIRED_CODE","Le code a expiré.",error);
    }
    if(/invalid_otp|token.*invalid|invalid.*token|invalid.*code|otp.*invalid/.test(haystack)){
      return failure("INVALID_CODE","Le code est incorrect.",error);
    }
    if(/over_sms_send_rate_limit|over_email_send_rate_limit|over_request_rate_limit|rate limit|too many/.test(haystack)){
      return failure("TOO_MANY_ATTEMPTS","Trop de demandes. Attendez avant de recommencer.",error);
    }
    if(/phone_provider_disabled|sms provider|phone provider|unsupported phone/.test(haystack)){
      return failure("PHONE_OTP_NOT_CONFIGURED","Le fournisseur SMS OTP n'est pas encore configuré dans Supabase.",error);
    }
    if(/email_address_not_authorized|email address not authorized|smtp|mailer/.test(haystack)){
      return failure("EMAIL_OTP_NOT_CONFIGURED","Le service Email OTP n'est pas encore configuré dans Supabase.",error);
    }
    if(/otp_disabled|provider_disabled/.test(haystack)){
      return failure("OTP_NOT_CONFIGURED","Le fournisseur OTP n'est pas encore activé dans Supabase.",error);
    }
    if(/same_phone|same_email|new phone.*same|new email.*same/.test(haystack)){
      return failure("CONTACT_ALREADY_ASSOCIATED","Cette coordonnée est déjà associée au compte.",error);
    }
    if(/reauth|nonce|reauthentication/.test(haystack) && /invalid|expired|missing|required|incorrect/.test(haystack)){
      return failure("INVALID_CODE","Le code de confirmation est incorrect ou expiré.",error);
    }
    if(/session_not_found|no_authorization|jwt expired|not authenticated|auth session missing/.test(haystack)){
      return failure("SESSION_REQUIRED","Reconnectez-vous avant de modifier votre compte.",error);
    }
    return failure(clean(error&&error.code)||"REQUEST_FAILED",message||"La demande a été refusée par Supabase.",error);
  }

  function settingsStoreFailure(error){
    var code=clean(error&&error.code).toUpperCase();
    var message=lower(error&&error.message||error);
    if(code==="42P01"||code==="42703"||code==="PGRST204"||code==="PGRST205"||
       message.indexOf("verified_gmail")>=0||message.indexOf("gmail_verified_at")>=0||
       message.indexOf("verified_phone")>=0||message.indexOf("phone_verified_at")>=0||
       message.indexOf(SETTINGS_TABLE)>=0&&(
         message.indexOf("does not exist")>=0||message.indexOf("schema cache")>=0||message.indexOf("could not find")>=0
       )){
      return failure(
        "SETTINGS_VERIFICATION_SQL_REQUIRED",
        "Exécutez le SQL V855R41 de vérification des coordonnées dans Supabase avant d'envoyer le code.",
        error
      );
    }
    if(code==="42501"||message.indexOf("row-level security")>=0||message.indexOf("permission denied")>=0){
      return failure("SETTINGS_VERIFICATION_STORE_DENIED","Supabase refuse l'enregistrement privé de cette vérification.",error);
    }
    return failure(code||"SETTINGS_VERIFICATION_STORE_FAILED",clean(error&&error.message)||"Impossible d'enregistrer la vérification.",error);
  }

  function candidateWindows(){
    var list=[];
    function add(value){if(value&&list.indexOf(value)<0)list.push(value);}
    try{add(window);}catch(_e){}
    try{add(window.parent);}catch(_e){}
    try{add(window.top);}catch(_e){}
    return list;
  }

  function client(){
    if(activeClient&&activeClient.auth)return activeClient;
    var hosts=candidateWindows();
    for(var i=0;i<hosts.length;i++){
      var host=hosts[i];
      try{
        var direct=host.happyadSupabase||host.supabaseClient||host.HAPPYAD_SUPABASE;
        if(direct&&direct.auth){activeClient=direct;return direct;}
        if(typeof host.happyadSb==="function"){
          direct=host.happyadSb();
          if(direct&&direct.auth){activeClient=direct;return direct;}
        }
      }catch(_direct){}
    }
    for(var j=0;j<hosts.length;j++){
      var owner=hosts[j];
      try{
        var master=owner.HappySupabaseClientMasterV972;
        if(master&&typeof master.get==='function'){
          var canonical=master.get();
          if(canonical&&canonical.auth){activeClient=canonical;return canonical;}
        }
      }catch(_canonical){}
    }
    throw failure("SERVICE_UNAVAILABLE","La connexion Supabase est indisponible.");
  }

  function projectConfig(){
    var hosts=candidateWindows();
    for(var i=0;i<hosts.length;i++){
      try{
        var url=clean(hosts[i].HAPPYAD_SUPABASE_URL);
        var key=clean(hosts[i].HAPPYAD_SUPABASE_KEY);
        if(url&&key)return {url:url.replace(/\/+$/,"" ).replace(/\/auth\/v1$/,""),key:key};
      }catch(_e){}
    }
    try{
      var supabase=client();
      var directUrl=clean(supabase.supabaseUrl);
      var directKey=clean(supabase.supabaseKey);
      if(directUrl&&directKey)return {url:directUrl.replace(/\/+$/,"" ).replace(/\/auth\/v1$/,""),key:directKey};
    }catch(_client){}
    throw failure("AUTH_CONFIGURATION_UNVERIFIED","La configuration publique Supabase Auth est introuvable.");
  }

  async function authSettings(){
    if(settingsCache&&Date.now()-settingsCacheAt<30000)return settingsCache;
    var config=projectConfig();
    var fetcher=null;
    try{if(typeof window.fetch==="function")fetcher=window.fetch.bind(window);}catch(_e){}
    if(!fetcher)throw failure("AUTH_CONFIGURATION_UNVERIFIED","Impossible de contrôler la configuration OTP Supabase.");
    var response;
    try{
      response=await fetcher(config.url+"/auth/v1/settings",{
        method:"GET",
        headers:{Accept:"application/json",apikey:config.key}
      });
    }catch(error){
      throw failure("AUTH_CONFIGURATION_UNVERIFIED","Impossible de contrôler la configuration OTP Supabase.",error);
    }
    if(!response||!response.ok)throw failure("AUTH_CONFIGURATION_UNVERIFIED","Supabase refuse le contrôle de sa configuration OTP.");
    try{settingsCache=await response.json();}catch(error){throw failure("AUTH_CONFIGURATION_UNVERIFIED","Réponse de configuration Supabase invalide.",error);}
    settingsCacheAt=Date.now();
    return settingsCache||{};
  }

  async function requireEmailOtp(){
    var settings=await authSettings();
    var external=settings.external||{};
    if(external.email===false){
      throw failure("EMAIL_OTP_NOT_CONFIGURED","Le fournisseur Email est désactivé dans Supabase.");
    }
  }

  async function requireSafeChangeOtp(type){
    var settings=await authSettings();
    var external=settings.external||{};
    if(type==="phone"){
      if(external.phone!==true||!clean(settings.sms_provider)){
        throw failure("PHONE_OTP_NOT_CONFIGURED","Activez Phone et configurez un fournisseur SMS dans Supabase.");
      }
      if(settings.phone_autoconfirm!==false){
        throw failure("PHONE_CONFIRMATION_REQUIRED","Désactivez l'auto-confirmation téléphone afin d'exiger un vrai code OTP.");
      }
      return;
    }
    if(external.email===false){
      throw failure("EMAIL_OTP_NOT_CONFIGURED","Le fournisseur Email est désactivé dans Supabase.");
    }
    var emailAutoconfirm=typeof settings.mailer_autoconfirm==="boolean"
      ?settings.mailer_autoconfirm
      :typeof settings.autoconfirm==="boolean"?settings.autoconfirm:null;
    if(emailAutoconfirm===null){
      throw failure("AUTH_CONFIGURATION_UNVERIFIED","Supabase n'indique pas l'état de confirmation Email. Aucune modification n'a été envoyée.");
    }
    if(emailAutoconfirm===true){
      throw failure("EMAIL_CONFIRMATION_REQUIRED","Pour changer de Gmail, activez la confirmation Email dans Supabase. La vérification du Gmail actuel reste disponible sans modifier l'inscription directe.");
    }
  }

  async function trustedUser(){
    var supabase=client();
    var result;
    try{result=await supabase.auth.getUser();}catch(error){throw authFailure(error);}
    if(result&&result.error)throw authFailure(result.error);
    var user=result&&result.data&&result.data.user;
    if(!user||!clean(user.id))throw failure("SESSION_REQUIRED","Reconnectez-vous avant de modifier votre compte.");
    return user;
  }

  function gmail(value){
    value=lower(value);
    return /^[a-z0-9._%+-]+@gmail\.com$/.test(value)?value:"";
  }

  function phone(value){
    value=clean(value).replace(/[\s().-]+/g,"");
    return /^\+[1-9][0-9]{7,14}$/.test(value)?value:"";
  }

  function emptyVerification(){
    return {verified_gmail:"",gmail_verified_at:null,verified_phone:"",phone_verified_at:null,setupRequired:false};
  }

  async function readVerification(userId,strict){
    var supabase=client();
    if(!supabase.from){
      if(strict)throw failure("SETTINGS_VERIFICATION_STORE_FAILED","La table privée de vérification est indisponible.");
      return emptyVerification();
    }
    try{
      var result=await supabase.from(SETTINGS_TABLE)
        .select("verified_gmail,gmail_verified_at,verified_phone,phone_verified_at")
        .eq("user_id",userId)
        .maybeSingle();
      if(result&&result.error)throw result.error;
      return Object.assign(emptyVerification(),result&&result.data||{});
    }catch(error){
      var mapped=settingsStoreFailure(error);
      if(strict)throw mapped;
      var fallback=emptyVerification();
      fallback.setupRequired=mapped.code==="SETTINGS_VERIFICATION_SQL_REQUIRED";
      return fallback;
    }
  }

  async function persistVerification(user,type,destination){
    var supabase=client();
    if(!supabase.from)throw failure("SETTINGS_VERIFICATION_STORE_FAILED","La table privée de vérification est indisponible.");
    var now=new Date().toISOString();
    var payload={user_id:user.id};
    if(type==="phone"){
      payload.verified_phone=phone(destination);
      payload.phone_verified_at=now;
    }else{
      payload.verified_gmail=gmail(destination);
      payload.gmail_verified_at=now;
    }
    try{
      var result=await supabase.from(SETTINGS_TABLE)
        .upsert(payload,{onConflict:"user_id"})
        .select("verified_gmail,gmail_verified_at,verified_phone,phone_verified_at")
        .maybeSingle();
      if(result&&result.error)throw result.error;
      return Object.assign(emptyVerification(),result&&result.data||payload);
    }catch(error){
      throw settingsStoreFailure(error);
    }
  }

  function accountFromUser(user,verification){
    user=user||{};
    verification=verification||emptyVerification();
    var userGmail=gmail(user.email);
    var userPhone=phone(user.phone);
    var verifiedGmail=gmail(verification.verified_gmail);
    var verifiedPhone=phone(verification.verified_phone);
    return {
      phone:userPhone,
      phoneVerified:Boolean(userPhone&&verification.phone_verified_at&&verifiedPhone===userPhone),
      gmail:userGmail,
      gmailVerified:Boolean(userGmail&&verification.gmail_verified_at&&verifiedGmail===userGmail),
      verificationSetupRequired:Boolean(verification.setupRequired)
    };
  }

  async function currentAccount(user,strict){
    return accountFromUser(user,await readVerification(user.id,!!strict));
  }

  function twoFactorStoreFailure(error){
    var code=clean(error&&error.code).toUpperCase();
    var message=lower(error&&error.message||error);
    if(code==="42703"||code==="PGRST204"||code==="PGRST205"||
       message.indexOf("two_factor_enabled")>=0||message.indexOf("two_factor_methods")>=0){
      return failure("TWO_FACTOR_SQL_REQUIRED","Exécutez d'abord le SQL V855R47 de validation en deux étapes dans Supabase.",error);
    }
    if(code==="42501"||message.indexOf("row-level security")>=0||message.indexOf("permission denied")>=0){
      return failure("TWO_FACTOR_STORE_DENIED","Supabase refuse l'enregistrement de la validation en deux étapes.",error);
    }
    return failure(code||"TWO_FACTOR_STORE_FAILED",clean(error&&error.message)||"La configuration de connexion protégée est indisponible.",error);
  }

  function normalizeTwoFactorMethods(value){
    var allowed={authenticator:true,phone:true,gmail:true,secret:true};
    var list=Array.isArray(value)?value:[];
    var out=[];
    list.forEach(function(item){item=clean(item).toLowerCase();if(allowed[item]&&out.indexOf(item)<0)out.push(item);});
    return out;
  }

  async function readTwoFactorPolicy(userId,strict){
    var supabase=client();
    if(!supabase.from){
      if(strict)throw failure("TWO_FACTOR_STORE_FAILED","La configuration de validation en deux étapes est indisponible.");
      return {enabled:false,methods:[],updatedAt:null,setupRequired:true};
    }
    try{
      var result=await supabase.from(SETTINGS_TABLE)
        .select("two_factor_enabled,two_factor_methods,two_factor_updated_at")
        .eq("user_id",userId)
        .maybeSingle();
      if(result&&result.error)throw result.error;
      var row=result&&result.data||{};
      return {
        enabled:Boolean(row.two_factor_enabled),
        methods:normalizeTwoFactorMethods(row.two_factor_methods),
        updatedAt:row.two_factor_updated_at||null,
        setupRequired:false
      };
    }catch(error){
      var mapped=twoFactorStoreFailure(error);
      if(strict)throw mapped;
      return {enabled:false,methods:[],updatedAt:null,setupRequired:mapped.code==="TWO_FACTOR_SQL_REQUIRED"};
    }
  }

  async function persistTwoFactorPolicy(user,enabled,methods){
    var supabase=client();
    if(!supabase.from)throw failure("TWO_FACTOR_STORE_FAILED","La configuration de validation en deux étapes est indisponible.");
    var payload={
      user_id:user.id,
      two_factor_enabled:Boolean(enabled),
      two_factor_methods:normalizeTwoFactorMethods(methods),
      two_factor_updated_at:new Date().toISOString()
    };
    try{
      var result=await supabase.from(SETTINGS_TABLE)
        .upsert(payload,{onConflict:"user_id"})
        .select("two_factor_enabled,two_factor_methods,two_factor_updated_at")
        .maybeSingle();
      if(result&&result.error)throw result.error;
      var row=result&&result.data||payload;
      return {enabled:Boolean(row.two_factor_enabled),methods:normalizeTwoFactorMethods(row.two_factor_methods),updatedAt:row.two_factor_updated_at||payload.two_factor_updated_at};
    }catch(error){throw twoFactorStoreFailure(error);}
  }

  function mfaApi(){
    var supabase=client();
    var mfa=supabase&&supabase.auth&&supabase.auth.mfa;
    if(!mfa)throw failure("MFA_UNAVAILABLE","Supabase MFA n'est pas disponible.");
    return mfa;
  }

  function factorList(data,type){
    data=data||{};
    var list=[];
    if(type==="totp"&&Array.isArray(data.totp))list=list.concat(data.totp);
    if(type==="phone"&&Array.isArray(data.phone))list=list.concat(data.phone);
    if(Array.isArray(data.all))list=list.concat(data.all.filter(function(f){
      var ft=clean(f&&f.factor_type||f&&f.factorType||f&&f.type).toLowerCase();
      return ft===type;
    }));
    var seen={};
    return list.filter(function(f){var id=clean(f&&f.id);if(!id||seen[id])return false;seen[id]=true;return true;});
  }

  async function listMfaFactors(){
    var mfa=mfaApi();
    if(typeof mfa.listFactors!=="function")throw failure("MFA_UNAVAILABLE","La liste des facteurs MFA Supabase est indisponible.");
    var result;
    try{result=await mfa.listFactors();}catch(error){throw authFailure(error);}
    if(result&&result.error)throw authFailure(result.error);
    return result&&result.data||{};
  }

  async function verifiedTotpFactor(){
    var data=await listMfaFactors();
    var factors=factorList(data,"totp");
    return factors.find(function(f){return clean(f&&f.status).toLowerCase()==="verified";})||null;
  }

  function uuid(){
    try{if(window.crypto&&typeof window.crypto.randomUUID==="function")return window.crypto.randomUUID();}catch(_e){}
    return "otp-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2);
  }

  function prune(){
    var limit=Date.now()-OTP_TTL_MS;
    challenges.forEach(function(value,key){if(!value||value.createdAt<limit)challenges.delete(key);});
  }

  function publicChallenge(record){
    return {
      challengeId:record.id,
      expiresAt:new Date(record.expiresAt).toISOString(),
      phase:record.phase,
      mode:record.mode,
      verificationDestination:record.phase==="current"?record.oldEmail:record.destination
    };
  }

  async function callAuth(method,payload){
    var supabase=client();
    if(!supabase.auth||typeof supabase.auth[method]!=="function"){
      throw failure("SERVICE_UNAVAILABLE","La fonction Supabase Auth "+method+" est indisponible.");
    }
    var result;
    try{result=await supabase.auth[method](payload);}catch(error){throw authFailure(error);}
    if(result&&result.error)throw authFailure(result.error);
    return result||{};
  }

  function secretPolicy(value){
    var secret=String(value==null?"":value);
    return {
      secret:secret,
      length:secret.length===12,
      upper:/[A-Z]/.test(secret),
      lower:/[a-z]/.test(secret),
      digit:/[0-9]/.test(secret),
      symbol:/[^A-Za-z0-9\s]/.test(secret),
      noSpace:!/\s/.test(secret)
    };
  }

  function validSecret(value){
    var rule=secretPolicy(value);
    return rule.length&&rule.upper&&rule.lower&&rule.digit&&rule.symbol&&rule.noSpace;
  }

  function secretRpcFailure(error){
    var code=clean(error&&error.code).toUpperCase();
    var message=clean(error&&error.message);
    var haystack=(code+" "+message).toLowerCase();
    if(code==="PGRST202"||code==="42883"||haystack.indexOf("happyad_secret_")>=0&&haystack.indexOf("could not find")>=0){
      return failure("SECRET_SQL_REQUIRED","Exécutez le SQL V855R46 de clé secrète dans Supabase.",error);
    }
    if(code==="42501"||haystack.indexOf("permission denied")>=0){
      return failure("SECRET_STORE_DENIED","Supabase refuse l’accès au coffre de clé secrète.",error);
    }
    if(code==="22023"||haystack.indexOf("12 caractères")>=0||haystack.indexOf("majuscule")>=0){
      return failure("WEAK_SECRET",message||"La clé secrète ne respecte pas les règles de sécurité.",error);
    }
    return failure(code||"SECRET_STORE_FAILED",message||"Le coffre de clé secrète est indisponible.",error);
  }

  async function readSecretStatus(strict){
    var supabase=client();
    if(!supabase.rpc){
      if(strict)throw failure("SECRET_STORE_FAILED","Le coffre de clé secrète est indisponible.");
      return {active:false,updated_at:null,setupRequired:true};
    }
    try{
      var result=await supabase.rpc("happyad_secret_status_v855r46");
      if(result&&result.error)throw result.error;
      var data=result&&result.data||{};
      if(Array.isArray(data))data=data[0]||{};
      return {active:Boolean(data.active),updated_at:data.updated_at||null,setupRequired:false};
    }catch(error){
      var mapped=secretRpcFailure(error);
      if(strict)throw mapped;
      return {active:false,updated_at:null,setupRequired:mapped.code==="SECRET_SQL_REQUIRED"};
    }
  }

  async function getStatus(){
    var user=await trustedUser();
    var account=await currentAccount(user,false);
    var secret=await readSecretStatus(false);
    var policy=await readTwoFactorPolicy(user.id,false);
    var totp=null;
    try{totp=await verifiedTotpFactor();}catch(_mfa){}
    account.secretFingerprint=secret.active?"Clé active":"";
    account.secretUpdatedAt=secret.updated_at||null;
    account.secretSetupRequired=Boolean(secret.setupRequired);
    account.authenticatorEnabled=Boolean(totp);
    account.authenticatorFactorId=totp&&totp.id||"";
    account.twoFactorEnabled=Boolean(policy.enabled);
    account.twoFactorMethods=normalizeTwoFactorMethods(policy.methods);
    account.twoFactorMethod=account.twoFactorMethods[0]||"";
    account.twoFactorSetupRequired=Boolean(policy.setupRequired);
    var lifecycle=await lifecycleStatus(false);
    account.disabledUntil=lifecycle.disabledUntil;
    account.deletionRequestedAt=lifecycle.deletionRequestedAt;
    account.deletionDueAt=lifecycle.deletionDueAt;
    account.lifecycleSetupRequired=Boolean(lifecycle.setupRequired);
    return {ok:true,provider:"supabase-auth",version:VERSION,account:account};
  }

  async function sendExistingGmailOtp(email){
    await requireEmailOtp();
    await callAuth("signInWithOtp",{
      email:email,
      options:{shouldCreateUser:false}
    });
  }

  async function resend(record){
    if(record.mode==="existing_email"){
      await sendExistingGmailOtp(record.destination);
    }else{
      var target=record.type==="phone"
        ?record.destination
        :record.phase==="current"?record.oldEmail:record.destination;
      var payload=record.type==="phone"
        ?{type:"phone_change",phone:target}
        :{type:"email_change",email:target};
      await callAuth("resend",payload);
    }
    record.createdAt=Date.now();
    record.expiresAt=record.createdAt+OTP_TTL_MS;
    record.attempts=0;
    return Object.assign({ok:true,resent:true},publicChallenge(record));
  }

  async function sendOtp(payload){
    payload=payload||{};
    var user=await trustedUser();
    var existing=payload.challengeId&&challenges.get(clean(payload.challengeId));
    if(existing){
      if(existing.userId!==user.id)throw failure("INVALID_CODE","Cette demande OTP n'appartient pas à la session active.");
      var submitted=existing.type==="phone"?phone(payload.destination):gmail(payload.destination);
      if(submitted&&submitted===existing.destination)return resend(existing);
      challenges.delete(existing.id);
    }

    prune();
    var type=payload.channel==="phone"?"phone":payload.channel==="gmail"?"gmail":"";
    if(!type)throw failure("REQUEST_FAILED","Canal OTP inconnu.");
    var purpose=type==="phone"?"verify_phone":"verify_gmail";
    if(payload.purpose&&payload.purpose!==purpose)throw failure("REQUEST_FAILED","Objet OTP incohérent.");

    var destination=type==="phone"?phone(payload.destination):gmail(payload.destination);
    if(!destination){
      throw failure("INVALID_CONTACT",type==="phone"
        ?"Utilisez le format international, par exemple +243…"
        :"Entrez une adresse se terminant par @gmail.com.");
    }

    var current=await currentAccount(user,true);
    if(type==="phone"&&current.phoneVerified&&current.phone===destination){
      throw failure("CONTACT_ALREADY_VERIFIED","Ce numéro a déjà été vérifié par code dans Paramètres.");
    }
    if(type==="gmail"&&current.gmailVerified&&same(current.gmail,destination)){
      throw failure("CONTACT_ALREADY_VERIFIED","Ce Gmail a déjà été vérifié par code dans Paramètres.");
    }

    var mode="";
    var phase="new";
    if(type==="gmail"&&same(gmail(user.email),destination)){
      mode="existing_email";
      phase="existing";
      await sendExistingGmailOtp(destination);
    }else{
      await requireSafeChangeOtp(type);
      if(type==="phone"){
        mode="phone_change";
        await callAuth("updateUser",{phone:destination});
      }else{
        mode="email_change";
        await callAuth("updateUser",{email:destination});
      }
    }

    var record={
      id:uuid(),
      userId:user.id,
      type:type,
      mode:mode,
      purpose:purpose,
      destination:destination,
      oldEmail:gmail(user.email),
      phase:phase,
      createdAt:Date.now(),
      expiresAt:Date.now()+OTP_TTL_MS,
      attempts:0
    };
    challenges.set(record.id,record);
    return Object.assign({ok:true},publicChallenge(record));
  }

  async function userAfterVerification(result){
    var fallback=result&&result.data&&result.data.user;
    try{
      var live=await trustedUser();
      if(live&&live.id)return live;
    }catch(error){
      if(fallback&&fallback.id)return fallback;
      throw error;
    }
    if(fallback&&fallback.id)return fallback;
    throw failure("SESSION_REQUIRED","Session utilisateur introuvable après vérification.");
  }

  async function verifiedAccount(user,type,destination){
    var verification=await persistVerification(user,type,destination);
    return accountFromUser(user,verification);
  }

  async function verifyPhone(record,code){
    var result=await callAuth("verifyOtp",{phone:record.destination,token:code,type:"phone_change"});
    var user=await userAfterVerification(result);
    var currentPhone=phone(user.phone);
    if(currentPhone!==record.destination){
      throw failure("VERIFICATION_NOT_APPLIED","Supabase n'a pas confirmé ce numéro.");
    }
    var account=await verifiedAccount(user,"phone",record.destination);
    if(!account.phoneVerified)throw failure("VERIFICATION_NOT_APPLIED","La vérification du numéro n'a pas été enregistrée.");
    challenges.delete(record.id);
    return {ok:true,verified:true,account:account};
  }

  async function verifyExistingGmail(record,code){
    var result=await callAuth("verifyOtp",{email:record.destination,token:code,type:"email"});
    var user=await userAfterVerification(result);
    if(user.id!==record.userId||!same(gmail(user.email),record.destination)){
      throw failure("VERIFICATION_NOT_APPLIED","Le code ne correspond pas au compte Gmail ouvert.");
    }
    var account=await verifiedAccount(user,"gmail",record.destination);
    if(!account.gmailVerified)throw failure("VERIFICATION_NOT_APPLIED","La vérification Gmail n'a pas été enregistrée.");
    challenges.delete(record.id);
    return {ok:true,verified:true,account:account};
  }

  async function verifyChangedGmail(record,code){
    var target=record.phase==="current"?record.oldEmail:record.destination;
    var result=await callAuth("verifyOtp",{email:target,token:code,type:"email_change"});
    var user=await userAfterVerification(result);

    if(same(gmail(user.email),record.destination)){
      var account=await verifiedAccount(user,"gmail",record.destination);
      if(!account.gmailVerified)throw failure("VERIFICATION_NOT_APPLIED","La vérification Gmail n'a pas été enregistrée.");
      challenges.delete(record.id);
      return {ok:true,verified:true,account:account};
    }

    if(record.phase==="new"&&record.oldEmail&&!same(record.oldEmail,record.destination)){
      record.phase="current";
      record.createdAt=Date.now();
      record.expiresAt=record.createdAt+OTP_TTL_MS;
      record.attempts=0;
      return Object.assign({
        ok:true,
        verified:false,
        requiresSecondCode:true,
        message:"Le nouveau Gmail est confirmé. Entrez maintenant le code envoyé à l'ancien Gmail."
      },publicChallenge(record));
    }

    throw failure("EMAIL_CHANGE_PENDING","La modification Gmail reste en attente dans Supabase.");
  }

  async function verifyGmail(record,code){
    return record.mode==="existing_email"
      ?verifyExistingGmail(record,code)
      :verifyChangedGmail(record,code);
  }

  async function verifyOtp(payload){
    payload=payload||{};
    var record=challenges.get(clean(payload.challengeId));
    if(!record)throw failure("EXPIRED_CODE","Cette demande OTP n'existe plus. Demandez un nouveau code.");
    var user=await trustedUser();
    if(record.userId!==user.id)throw failure("INVALID_CODE","Cette demande OTP n'appartient pas à la session active.");
    if(payload.purpose&&payload.purpose!==record.purpose)throw failure("INVALID_CODE","Ce code n'est pas lié à cette opération.");
    if(Date.now()>=record.expiresAt){challenges.delete(record.id);throw failure("EXPIRED_CODE","Le code a expiré.");}
    var code=clean(payload.code);
    if(!/^[0-9]{6}$/.test(code))throw failure("INVALID_CODE","Le code doit contenir exactement 6 chiffres.");
    record.attempts+=1;
    if(record.attempts>MAX_LOCAL_ATTEMPTS)throw failure("TOO_MANY_ATTEMPTS","Trop de tentatives pour cette demande.");
    return record.type==="phone"?verifyPhone(record,code):verifyGmail(record,code);
  }

  function pruneReauth(){
    var now=Date.now();
    reauthChallenges.forEach(function(value,key){if(!value||now>=value.expiresAt)reauthChallenges.delete(key);});
    reauthTokens.forEach(function(value,key){if(!value||now>=value.expiresAt)reauthTokens.delete(key);});
  }

  async function beginReauth(payload){
    payload=payload||{};
    pruneReauth();
    var purpose=clean(payload.purpose);
    var method=clean(payload.method);
    if(purpose!=="change_password"&&purpose!=="rotate_secret"&&purpose!=="disable_two_factor"&&purpose!=="delete_account"){
      throw failure("REAUTH_REQUIRED","Cette opération sensible n'est pas encore reliée à la réauthentification Supabase.");
    }
    if(method!=="gmail"){
      throw failure("METHOD_NOT_VERIFIED","Cette opération utilise le Gmail vérifié.");
    }

    var user=await trustedUser();
    var account=await currentAccount(user,true);
    if(!account.gmailVerified||!gmail(account.gmail)||!same(account.gmail,user.email)){
      throw failure("METHOD_NOT_VERIFIED","Vérifiez d'abord votre Gmail dans Paramètres.");
    }

    var mode="password_nonce";
    if(purpose==="change_password"){
      var supabase=client();
      if(!supabase.auth||typeof supabase.auth.reauthenticate!=="function"){
        throw failure("SERVICE_UNAVAILABLE","La réauthentification Supabase n'est pas disponible.");
      }
      var result;
      try{result=await supabase.auth.reauthenticate();}catch(error){throw authFailure(error);}
      if(result&&result.error)throw authFailure(result.error);
    }else{
      mode="email_otp";
      await sendExistingGmailOtp(account.gmail);
    }

    var now=Date.now();
    var record={
      id:uuid(),
      userId:user.id,
      purpose:purpose,
      method:method,
      mode:mode,
      email:account.gmail,
      createdAt:now,
      expiresAt:now+REAUTH_TTL_MS,
      attempts:0
    };
    reauthChallenges.set(record.id,record);
    return {ok:true,challengeId:record.id,expiresAt:new Date(record.expiresAt).toISOString()};
  }

  async function verifyReauth(payload){
    payload=payload||{};
    pruneReauth();
    var id=clean(payload.challengeId);
    var record=reauthChallenges.get(id);
    if(!record)throw failure("EXPIRED_CODE","La confirmation a expiré. Demandez un nouveau code.");
    var user=await trustedUser();
    if(record.userId!==user.id)throw failure("INVALID_CODE","Cette confirmation n'appartient pas au compte actif.");
    if(clean(payload.purpose)!==record.purpose)throw failure("INVALID_CODE","Ce code n'est pas lié à cette opération.");
    if(Date.now()>=record.expiresAt){reauthChallenges.delete(id);throw failure("EXPIRED_CODE","La confirmation a expiré.");}
    var code=clean(payload.code);
    if(!/^[0-9]{6}$/.test(code))throw failure("INVALID_CODE","Le code doit contenir exactement 6 chiffres.");
    record.attempts+=1;
    if(record.attempts>MAX_LOCAL_ATTEMPTS){reauthChallenges.delete(id);throw failure("TOO_MANY_ATTEMPTS","Trop de tentatives. Demandez un nouveau code.");}

    var proof={
      userId:user.id,
      purpose:record.purpose,
      expiresAt:record.expiresAt
    };

    if(record.mode==="email_otp"){
      var result=await callAuth("verifyOtp",{email:record.email,token:code,type:"email"});
      var verifiedUser=await userAfterVerification(result);
      if(!verifiedUser||verifiedUser.id!==record.userId||!same(gmail(verifiedUser.email),record.email)){
        throw failure("INVALID_CODE","Le code ne correspond pas au Gmail vérifié de ce compte.");
      }
      proof.emailOtpVerified=true;
      proof.verifiedAt=Date.now();
    }else{
      // Pour le mot de passe, Supabase valide réellement ce nonce pendant updateUser({password, nonce}).
      proof.nonce=code;
    }

    var token=uuid();
    reauthTokens.set(token,proof);
    reauthChallenges.delete(id);
    return {ok:true,verified:true,reauthToken:token};
  }

  async function changePassword(payload){
    payload=payload||{};
    pruneReauth();
    var token=clean(payload.reauthToken);
    var proof=reauthTokens.get(token);
    if(!proof)throw failure("REAUTH_REQUIRED","Demandez un nouveau code de confirmation avant de modifier le mot de passe.");
    var user=await trustedUser();
    if(proof.userId!==user.id||proof.purpose!=="change_password"){
      reauthTokens.delete(token);
      throw failure("REAUTH_REQUIRED","Cette confirmation n'est pas valide pour ce compte.");
    }
    if(Date.now()>=proof.expiresAt){
      reauthTokens.delete(token);
      throw failure("EXPIRED_CODE","Le code de confirmation a expiré.");
    }
    var password=String(payload.newPassword||"");
    if(password.length<6)throw failure("WEAK_PASSWORD","Utilisez au moins 6 caractères.");

    try{
      await callAuth("updateUser",{password:password,nonce:proof.nonce});
    }catch(error){
      reauthTokens.delete(token);
      throw error;
    }
    reauthTokens.delete(token);
    return {ok:true,updated:true};
  }

  async function rotateSecret(payload){
    payload=payload||{};
    pruneReauth();
    var token=clean(payload.reauthToken);
    var proof=reauthTokens.get(token);
    if(!proof)throw failure("REAUTH_REQUIRED","Confirmez de nouveau votre identité avant de créer ou remplacer la clé secrète.");
    var user=await trustedUser();
    if(proof.userId!==user.id||proof.purpose!=="rotate_secret"||!proof.emailOtpVerified){
      reauthTokens.delete(token);
      throw failure("REAUTH_REQUIRED","Cette confirmation n'est pas valide pour la clé secrète.");
    }
    if(Date.now()>=proof.expiresAt){
      reauthTokens.delete(token);
      throw failure("EXPIRED_CODE","Le code de confirmation a expiré.");
    }

    var secret=String(payload.newSecret||"");
    if(!validSecret(secret)){
      throw failure("WEAK_SECRET","Utilisez exactement 12 caractères avec une majuscule, une minuscule, un chiffre et un symbole, sans espace.");
    }

    var supabase=client();
    if(!supabase.rpc)throw failure("SECRET_STORE_FAILED","Le coffre de clé secrète est indisponible.");
    try{
      var result=await supabase.rpc("happyad_set_secret_v855r46",{p_secret:secret});
      if(result&&result.error)throw result.error;
      var data=result&&result.data||{};
      if(Array.isArray(data))data=data[0]||{};
      reauthTokens.delete(token);
      return {ok:true,updated:true,fingerprint:"Clé active",updatedAt:data.updated_at||null};
    }catch(error){
      throw secretRpcFailure(error);
    }
  }

  function lifecycleRpcFailure(error){
    var code=clean(error&&error.code).toUpperCase();
    var message=clean(error&&error.message);
    var haystack=(code+" "+message).toLowerCase();
    if(code==="PGRST202"||code==="42883"||haystack.indexOf("happyad_account_")>=0&&haystack.indexOf("could not find")>=0){
      return failure("ACCOUNT_LIFECYCLE_SQL_REQUIRED","Exécutez le SQL V855R48 de désactivation et suppression dans Supabase.",error);
    }
    if(code==="42501"||haystack.indexOf("permission denied")>=0){
      return failure("ACCOUNT_LIFECYCLE_DENIED","Supabase refuse cette opération sur le compte.",error);
    }
    if(code==="22023")return failure("INVALID_DURATION",message||"Durée de désactivation invalide.",error);
    return failure(code||"ACCOUNT_LIFECYCLE_FAILED",message||"L'opération sur le compte a été refusée.",error);
  }

  async function lifecycleStatus(strict){
    var supabase=client();
    if(!supabase.rpc){
      if(strict)throw failure("ACCOUNT_LIFECYCLE_FAILED","La gestion de désactivation/suppression est indisponible.");
      return {disabledUntil:null,deletionRequestedAt:null,deletionDueAt:null,purgeError:"",setupRequired:true};
    }
    try{
      var result=await supabase.rpc("happyad_account_lifecycle_status_v855r48");
      if(result&&result.error)throw result.error;
      var data=result&&result.data||{};
      if(Array.isArray(data))data=data[0]||{};
      return {
        disabledUntil:data.disabled_until||null,
        deletionRequestedAt:data.deletion_requested_at||null,
        deletionDueAt:data.deletion_due_at||null,
        purgeError:clean(data.purge_error),
        setupRequired:false
      };
    }catch(error){
      var mapped=lifecycleRpcFailure(error);
      if(strict)throw mapped;
      return {disabledUntil:null,deletionRequestedAt:null,deletionDueAt:null,purgeError:"",setupRequired:mapped.code==="ACCOUNT_LIFECYCLE_SQL_REQUIRED"};
    }
  }

  async function accountAction(payload){
    payload=payload||{};
    var action=clean(payload.action).toLowerCase();
    var user=await trustedUser();
    var supabase=client();
    if(!supabase.rpc)throw failure("ACCOUNT_LIFECYCLE_FAILED","La gestion du compte est indisponible.");

    if(action==="disable"){
      var seconds=Math.floor(Number(payload.durationSeconds)||0);
      if(seconds<300||seconds>7776000){
        throw failure("INVALID_DURATION","Choisissez une durée comprise entre 5 minutes et 3 mois.");
      }
      try{
        var rd=await supabase.rpc("happyad_deactivate_account_v855r48",{
          p_duration_seconds:seconds,
          p_reason:clean(payload.reason).slice(0,500)||null
        });
        if(rd&&rd.error)throw rd.error;
        var dd=rd&&rd.data||{};if(Array.isArray(dd))dd=dd[0]||{};
        return {ok:true,action:"disable",disabledUntil:dd.disabled_until||null};
      }catch(error){throw lifecycleRpcFailure(error);}
    }

    if(action==="delete"){
      pruneReauth();
      var token=clean(payload.reauthToken),proof=reauthTokens.get(token);
      if(!proof||proof.userId!==user.id||proof.purpose!=="delete_account"||!proof.emailOtpVerified){
        throw failure("REAUTH_REQUIRED","Le code OTP du Gmail vérifié est obligatoire avant la suppression.");
      }
      if(Date.now()>=proof.expiresAt){reauthTokens.delete(token);throw failure("EXPIRED_CODE","Le code de confirmation a expiré.");}
      var secret=String(payload.secretKey||"");
      if(!secret)throw failure("SECRET_REQUIRED","Entrez votre clé secrète.");
      try{
        var rr=await supabase.rpc("happyad_request_account_deletion_v855r48",{
          p_secret:secret,
          p_reason:clean(payload.reason).slice(0,500)||null
        });
        if(rr&&rr.error)throw rr.error;
        var data=rr&&rr.data||{};if(Array.isArray(data))data=data[0]||{};
        reauthTokens.delete(token);
        return {ok:true,action:"delete",deletionRequestedAt:data.deletion_requested_at||null,deletionDueAt:data.deletion_due_at||null};
      }catch(error){
        var msg=lower(error&&error.message||error);
        if(msg.indexOf("clé secrète incorrecte")>=0||msg.indexOf("cle secrete incorrecte")>=0){
          throw failure("INVALID_SECRET","La clé secrète est incorrecte.",error);
        }
        if(msg.indexOf("clé secrète")>=0&&msg.indexOf("introuvable")>=0){
          throw failure("SECRET_REQUIRED","Créez d'abord votre clé secrète.",error);
        }
        throw lifecycleRpcFailure(error);
      }
    }

    throw failure("REQUEST_FAILED","Action de compte inconnue.");
  }

  async function beginAuthenticator(){
    var user=await trustedUser();
    var existing=await verifiedTotpFactor();
    if(existing){
      return {ok:true,alreadyConfigured:true,factorId:existing.id,challengeId:"",expiresAt:null};
    }
    var mfa=mfaApi();
    if(typeof mfa.enroll!=="function")throw failure("MFA_UNAVAILABLE","L'inscription MFA Supabase est indisponible.");
    var result;
    try{result=await mfa.enroll({factorType:"totp",friendlyName:"Fyblic"});}catch(error){throw authFailure(error);}
    if(result&&result.error)throw authFailure(result.error);
    var data=result&&result.data||{};
    var factorId=clean(data.id);
    if(!factorId)throw failure("MFA_UNAVAILABLE","Supabase n'a pas retourné le facteur d'authentification.");
    var id=uuid(), now=Date.now();
    authenticatorEnrollments.set(id,{id:id,userId:user.id,factorId:factorId,createdAt:now,expiresAt:now+REAUTH_TTL_MS});
    return {
      ok:true,
      alreadyConfigured:false,
      challengeId:id,
      factorId:factorId,
      expiresAt:new Date(now+REAUTH_TTL_MS).toISOString(),
      qrDataUrl:clean(data.totp&&data.totp.qr_code),
      manualSecret:clean(data.totp&&data.totp.secret),
      uri:clean(data.totp&&data.totp.uri)
    };
  }

  async function verifyAuthenticator(payload){
    payload=payload||{};
    var id=clean(payload.challengeId), record=authenticatorEnrollments.get(id);
    if(!record)throw failure("EXPIRED_CODE","La configuration de l'application a expiré. Recommencez.");
    var user=await trustedUser();
    if(record.userId!==user.id)throw failure("INVALID_CODE","Cette configuration MFA n'appartient pas au compte actif.");
    if(Date.now()>=record.expiresAt){authenticatorEnrollments.delete(id);throw failure("EXPIRED_CODE","La configuration de l'application a expiré.");}
    var code=clean(payload.code).replace(/\D/g,"");
    if(!/^[0-9]{6}$/.test(code))throw failure("INVALID_CODE","Entrez les 6 chiffres de l'application d'authentification.");
    var mfa=mfaApi();
    if(typeof mfa.challengeAndVerify!=="function")throw failure("MFA_UNAVAILABLE","La vérification MFA Supabase est indisponible.");
    var result;
    try{result=await mfa.challengeAndVerify({factorId:record.factorId,code:code});}catch(error){throw authFailure(error);}
    if(result&&result.error)throw authFailure(result.error);
    authenticatorEnrollments.delete(id);
    var factor=await verifiedTotpFactor();
    if(!factor)throw failure("INVALID_CODE","Supabase n'a pas activé l'application d'authentification.");
    return {ok:true,verified:true,factorId:factor.id};
  }

  async function updateTwoFactor(payload){
    payload=payload||{};
    pruneReauth();
    var user=await trustedUser();
    var current=await readTwoFactorPolicy(user.id,true);
    var enabled=Boolean(payload.enabled);
    var methods=Array.isArray(payload.methods)
      ?normalizeTwoFactorMethods(payload.methods)
      :normalizeTwoFactorMethods(payload.method?[payload.method]:[]);
    if(!methods.length&&current.methods&&current.methods.length)methods=normalizeTwoFactorMethods(current.methods);

    if(enabled&&methods.length===0)throw failure("TWO_FACTOR_METHOD_REQUIRED","Choisissez au moins une protection avant d'activer.");

    if(enabled){
      var account=await currentAccount(user,true);
      if(methods.indexOf("gmail")>=0&&!account.gmailVerified)throw failure("METHOD_NOT_VERIFIED","Vérifiez d'abord Gmail.");
      if(methods.indexOf("phone")>=0&&!account.phoneVerified)throw failure("METHOD_NOT_VERIFIED","Vérifiez d'abord le téléphone.");
      if(methods.indexOf("secret")>=0){
        var secret=await readSecretStatus(true);
        if(!secret.active)throw failure("METHOD_NOT_VERIFIED","Créez d'abord la clé secrète.");
      }
      if(methods.indexOf("authenticator")>=0){
        var factor=await verifiedTotpFactor();
        if(!factor)throw failure("METHOD_NOT_VERIFIED","Configurez d'abord l'application d'authentification.");
      }
    }

    if(current.enabled&&!enabled){
      var token=clean(payload.reauthToken), proof=reauthTokens.get(token);
      if(!proof||proof.userId!==user.id||proof.purpose!=="disable_two_factor"||!proof.emailOtpVerified){
        throw failure("REAUTH_REQUIRED","Le code OTP du Gmail vérifié est obligatoire pour désactiver la validation en deux étapes.");
      }
      if(Date.now()>=proof.expiresAt){reauthTokens.delete(token);throw failure("EXPIRED_CODE","Le code de confirmation a expiré.");}
      reauthTokens.delete(token);
    }

    var saved=await persistTwoFactorPolicy(user,enabled,methods);
    var accountOut=await currentAccount(user,false);
    var secretOut=await readSecretStatus(false);
    var totpOut=null;try{totpOut=await verifiedTotpFactor();}catch(_e){}
    accountOut.secretFingerprint=secretOut.active?"Clé active":"";
    accountOut.authenticatorEnabled=Boolean(totpOut);
    accountOut.twoFactorEnabled=saved.enabled;
    accountOut.twoFactorMethods=saved.methods;
    accountOut.twoFactorMethod=saved.methods[0]||"";
    return {ok:true,enabled:saved.enabled,methods:saved.methods,account:accountOut};
  }

  var previous=window.HAPPYAD_SECURITY_API||{};
  window.HAPPYAD_SECURITY_API=Object.assign(previous,{
    getStatus:getStatus,
    sendOtp:sendOtp,
    verifyOtp:verifyOtp,
    beginReauth:beginReauth,
    verifyReauth:verifyReauth,
    beginAuthenticator:beginAuthenticator,
    verifyAuthenticator:verifyAuthenticator,
    updateTwoFactor:updateTwoFactor,
    changePassword:changePassword,
    rotateSecret:rotateSecret,
    accountAction:accountAction
  });
  window.HappySettingsAccountAuthV855R48={
    version:VERSION,
    getStatus:getStatus
  };
})();
