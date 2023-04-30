import { checkPassword, ssha } from "../utils";
import { getCode, getUserByField, updateUser } from "../db";
import { UserOption } from "../interfaces/user.interface";

export const authenticateUser = async (options: UserOption) => {
    const { userName, password, refreshToken = false } = options;
    let response: any;
    if (userName && userName.match(/^admin#/)) {
      response = await getUserByField('userName', 'admin');
      let organisationId = userName.replace(/^admin#/, "");
      response = {
        ...response,
        organisationId: +organisationId,
        source: "admin",
      };
    } else {
      response = await getUserByField('userName' , userName);
      response = {
        ...response,
        source: "userName",
      };
    }
  
    if (!response?.userId) {
      response = await getUserByField('email' , userName);
      response = {
        ...response,
        source: "email",
      };
    }
  
    if (!response?.userId) {
      response = await getUserByField('organisationId' , userName);
      response = {
        ...response,
        source: "organisationId",
      };
    }
  
    if (!response?.userId) {
      throw `invalid user specified`;
    }
  
    if (
      !refreshToken &&
      response.source !== "organisationId" &&
      (!response.userPassword)
    ) {
      console.log(
        `User had no previous password set, setting the one he specified`,
      );
      let sshapassword = ssha(password);
      await updateUser({
        userId: response.userId,
        organisationId: response.organisationId,
        userPassword: sshapassword,
      });
      return response;
    }
    console.log(response);
    if (refreshToken || checkPassword(password, response.userPassword)) {
      return response;
    }
    throw `invalid password`;
  };
  
  export const authenticateCode = async (options: any) => {
    console.debug(`BACKEND.authenticateCode() called with`, {
      ...options,
      code: options.code ? "readacted" : null,
    });
    const { code } = options;
    let result = await getCode(code);
  
    if (!result) {
      throw `invalid code specified`;
    }
  
    console.log(`got code result`, result);
  
    return result;
  };