export interface ClerkUser {
  id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  emailAddresses: { emailAddress: string; verification?: { status: string } }[];
  phoneNumbers?: { phoneNumber: string; verification?: { status: string } }[];
  imageUrl?: string;
}