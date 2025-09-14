export type AuthFormProps = {
  type: "login" | "register";
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading?: boolean;
  error?: string;
};

export type Quote = {
  quote: string;
  author: string;
};