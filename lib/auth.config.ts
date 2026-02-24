import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/auth/phone', // Redirect to phone login if not authenticated
    },
    providers: [], // Configured in auth.ts
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            const isOnAuth = nextUrl.pathname.startsWith('/auth');

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn && isOnAuth) {
                // Redirect logged-in users to their dashboard
                // We can't easily determine role here without the token, 
                // but we can trust the default redirect or handle it in middleware more granularly
                // regarding role based redirection. 
                // For now, let's just allow them to access auth pages if they want, 
                // or redirection logic should be handled in the page itself or middleware.
                // A common pattern is to redirect to dashboard if visiting login/signup while logged in.
                return Response.redirect(new URL('/dashboard', nextUrl));
            }
            return true;
        },
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
            }
            if (token.role && session.user) {
                session.user.role = token.role as "FARMER" | "BUYER";
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
            }
            return token;
        }
    },
} satisfies NextAuthConfig;
