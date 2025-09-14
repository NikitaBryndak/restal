export type AuthFormProps = {
  type: "login" | "register";
};

export type Quote = {
  quote: string;
  author: string;
};

export type Company = {
  name: string;
  logoUrl: string;
  websiteUrl: string;
};

export type Credential = { 
  email: string; 
  password: string; 
  confirmPassword?: string ;
}