declare global {
  interface Window {
    ethereum: any;
    payWithEduToken: (amount: string) => Promise<boolean>;
  }
}

export {}; 