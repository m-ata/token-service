import crypto from "crypto";

export const ssha = (cleartext: string, salt?: any) => {
  let sum = crypto.createHash("sha1");
  if (!salt) {
    console.log("no salt given");
    salt = crypto.randomBytes(8).toString("hex");
  } else {
    salt = salt.toString("hex");
  }

  sum.update(cleartext);
  sum.update(salt, "hex");
  const digest = sum.digest("hex");
  const ssha = "{SSHA}" + Buffer.from(digest + salt, "hex").toString("base64");
  return ssha;
};

// password check either they are equal or not
export const checkPassword = (in_password: string, hash: string) => {
  if (hash.substr(0, 6) === "{SSHA}") {
    return checkSsha(in_password, hash);
  } else {
    return false;
  }
};

// check hashes are eual or not
const checkSsha = (cleartext: string, hash: string) => {
  if (hash.substr(0, 6) !== "{SSHA}") {
    console.error("Not a SSHA hash");
    return false;
  }
  console.log('Buffer ===> ', Buffer);
  var bash = Buffer.from(hash.substr(6) as any, "base64") as any;
  var salt = bash.toString("hex").substr(40);
  var newSsha = ssha(cleartext, salt);
  return hash === newSsha;
};

export const getCodeTokenPayload = async (userData: any) => {
  console.debug(`BACKEND.getCodeTokenPayload() called with`, {
    ...userData,
    code: userData.code ? "readacted" : null,
  });
  let payload = {
    scope: "user profile",
    code: userData.code,
    organisationId: userData.organisationId,
    stayId: userData.stayId,
    campId: userData.campId,
  };

  return payload;
};

export const getTokenPayload = async (userData: any) => {
  console.debug(`BACKEND.getTokenPayload() called with`, {
    ...userData,
    password: userData.password ? "readacted" : null,
  });
  let payload = {
    firstName: userData.firstName,
    lastName: userData.lastName,
    name: userData.firstName + " " + userData.lastName,
    scope: "user profile",
    userName: userData.userName,
    email: userData.email,
    emailVerified: userData.emailVerified,
    userId: userData.userId,
    organisationId: userData.organisationId,
  };

  return payload;
};
