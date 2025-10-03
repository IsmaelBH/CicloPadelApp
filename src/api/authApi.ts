import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { FIREBASE_API_KEY } from '@env'

const API_KEY = FIREBASE_API_KEY;

export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery: fetchBaseQuery({ baseUrl: 'https://identitytoolkit.googleapis.com/v1/' }),
    endpoints: (builder) => ({
        signup: builder.mutation({
            query: (auth) => ({
                url: `accounts:signUp?key=${API_KEY}`,
                method: 'POST',
                body: auth,
            }),
        }),
        login: builder.mutation({
            query: (auth) => ({
                url: `accounts:signInWithPassword?key=${API_KEY}`,
                method: 'POST',
                body: auth,
            }),
        }),
    }),
});

export const { useSignupMutation, useLoginMutation } = authApi;
