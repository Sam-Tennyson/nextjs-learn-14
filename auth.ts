import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import Users from './models/users';
import bcrypt from 'bcrypt';
import { connectToDB } from './app/lib/database';


export const { auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    await connectToDB();
                    const user = await Users.findOne({ email, password });
                    // secure_password_login
                    // if (!user) return null;
                    // const passwordsMatch = await bcrypt.compare(password, user.password);
                    // console.log(passwordsMatch, "password");
                    // if (passwordsMatch) return user;
                    return user
                }
                return null
            },
        }),
    ],
});