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

export type TouristInfo = {
  id: number;
  name: string;
  pasportExpiryDate: string;
}

