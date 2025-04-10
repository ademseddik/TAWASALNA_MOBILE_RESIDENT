import Axios from 'axios';
import { APP_ENV } from '../utils/BaseUrl';

export const AuthService = {


  //////////////////////////////////////////////SIGN-IN//////////////////////////////////////////////////
  /////////////////////////////////////////////LOGIN////////////////////////////////////////////////////

  login: async (credentials) => {
    try {
      const response = await Axios.post(
        `${APP_ENV.AUTH_PORT}/tawasalna-user/auth/signin`,
        credentials
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  ////////////////////////////////FORGET PASSWORD///////////////////////////////////////////////////////

  forgetPassWord: async (credentials) => {
    try {
      const response = await Axios.post(
        `${APP_ENV.AUTH_PORT}/tawasalna-user/auth/forgotPassword`,
        credentials
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  //////////////////////////////////ENTER CODE//////////////////////////////////////////////////////////

  verifyCode: async (credentials) => {
    try {
      const response = await Axios.post(
        `${APP_ENV.AUTH_PORT}/tawasalna-user/auth/verifyCode`,
        credentials
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  //////////////////////////////////RESEND CODE////////////////////////////////////////////////////////////

  resetcode: async (credentials) => {
    try {
      const response = await Axios.patch(
        `${APP_ENV.AUTH_PORT}/tawasalna-user/auth/reset-code`,
        credentials
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  //////////////////////////////////RESET PASSWORD////////////////////////////////////////////////////////

  resetPassword: async (credentials) => {
    try {
      const response = await Axios.patch(
        `${APP_ENV.AUTH_PORT}/tawasalna-user/auth/resetPassword`,
        credentials
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  ////////////////////////////////////SIGN-UP////////////////////////////////////////////////////////////////////
  ///////////////////////////////////CREATE ACCOUNT////////////////////////////////////////////////////////////

  signUp: async (credentials) => {
    try {
      const response = await Axios.post(
        `${APP_ENV.AUTH_PORT}/tawasalna-user/auth/signup`,
        credentials
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  //////////////////////////////////////VRIFY EMAIL/////////////////////////////////////////////////////

  VerifyEmail: async (credentials) => {
    console.log(credentials)
    try {
      const response = await Axios.patch(
        `${APP_ENV.AUTH_PORT}/tawasalna-user/auth/verifyAccount`,
        credentials
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }, 
    //////////////////////////////////////VRIFY EMAIL/////////////////////////////////////////////////////

    ResendCode: async (credentials) => {
      try {
        const response = await Axios.patch(
          `${APP_ENV.AUTH_PORT}/tawasalna-user/auth/reset-code`,
          credentials
        );
        return response.data;
      } catch (error) {
        throw error;
      }
    },
 ///////////////////////////////////////////CHANGE PASSWORD////////////////////////////////////////////

 ChangePassword: async (credentials) => {

  try {
    const response = await Axios.patch(
      `${APP_ENV.AUTH_PORT}/tawasalna-user/residentmanagement/updatepassword/${credentials.userId}`,
      credentials
    );
    
    return response.data;
  } catch (error) {
    throw error;
  }
},
};