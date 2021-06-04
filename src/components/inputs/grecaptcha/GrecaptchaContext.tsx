import React, { FC, createContext, useEffect, ReactNode } from 'react';
import {
  GrecaptchaContextType,
  GrecaptchaResponseParams,
} from '../../../types';

declare var grecaptcha: any;
declare global {
  interface Window {
    onCallBack: Function;
  }
}

export interface GrecaptchaContext {
  children?: ReactNode;
  name: string;
  publicKey: string;
  v3?: boolean;
  captchaSize?: 'compact' | 'normal' | 'invisible';
  theme?: 'dark' | 'light';
  getResponse?: (args: GrecaptchaResponseParams) => void;
}

const GrecaptchaContextDefoValues: GrecaptchaContextType = {
  publicKey: '',
  validateCaptcha: async () => new Promise(() => {}),
  v3: false,
};

export const GrecaptchaContext = createContext<GrecaptchaContextType>(
  GrecaptchaContextDefoValues
);

export const GrecaptchaProvider: FC<GrecaptchaContext> = ({
  children,
  name,
  publicKey,
  v3,
  captchaSize,
  theme,
  getResponse = () => {},
}: GrecaptchaContext) => {
  const appendGrParam = v3
    ? `?render=${publicKey}`
    : '?onload=onCallBack&render=explicit';
  const grecaptchaScript = document.createElement('script');
  grecaptchaScript.src = `https://www.google.com/recaptcha/api.js${appendGrParam}`;
  grecaptchaScript.async = true;
  grecaptchaScript.defer = true;

  const verifyCallback = (token: any) => {
    getResponse({ token });
  };

  const onCallBack = () => {
    grecaptcha.render(name, {
      sitekey: publicKey,
      callback: verifyCallback,
      theme,
      size: captchaSize,
    });
  };

  const validateCaptcha = async () => {
    let response = '';

    try {
      const captchaToken = await grecaptcha.execute(publicKey, {
        action: 'submit',
      });
      if (captchaToken) {
        response = captchaToken;
      } else {
        console.warn(
          'Captcha could not be validated. code: CAPTCHA_UNABLE_VALIDATION'
        );
      }
    } catch (error) {
      console.warn(
        `There was an error validating the captcha: ${error.message}. code: CAPTCHA_TRY_ERROR`
      );
    }

    return response;
  };

  useEffect(() => {
    if (!v3) {
      window.onCallBack = onCallBack;
    }

    document.body.appendChild(grecaptchaScript);
    return () => {
      document.body.removeChild(grecaptchaScript);
    };
  }, []);

  return (
    <GrecaptchaContext.Provider
      value={{
        publicKey,
        validateCaptcha,
        v3,
      }}
    >
      {children}
    </GrecaptchaContext.Provider>
  );
};

export default GrecaptchaProvider;
