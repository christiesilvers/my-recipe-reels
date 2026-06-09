import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js'

const userPool = new CognitoUserPool({
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID as string,
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID as string,
})

export function signUp(email: string, password: string): Promise<void> {
  return new Promise((resolve, reject) => {
    userPool.signUp(
      email,
      password,
      [new CognitoUserAttribute({ Name: 'email', Value: email })],
      [],
      (err) => {
        if (err) reject(err)
        else resolve()
      }
    )
  })
}

export function confirmSignUp(email: string, code: string): Promise<void> {
  const user = new CognitoUser({ Username: email, Pool: userPool })
  return new Promise((resolve, reject) => {
    user.confirmRegistration(code, true, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

export function resendConfirmationCode(email: string): Promise<void> {
  const user = new CognitoUser({ Username: email, Pool: userPool })
  return new Promise((resolve, reject) => {
    user.resendConfirmationCode((err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

export function signIn(email: string, password: string): Promise<CognitoUser> {
  const user = new CognitoUser({ Username: email, Pool: userPool })
  const authDetails = new AuthenticationDetails({ Username: email, Password: password })
  return new Promise((resolve, reject) => {
    user.authenticateUser(authDetails, {
      onSuccess: () => resolve(user),
      onFailure: (err) => reject(err),
    })
  })
}

export function getCurrentUserEmail(): Promise<string | null> {
  const user = userPool.getCurrentUser()
  if (!user) return Promise.resolve(null)
  return new Promise((resolve) => {
    user.getSession((err: Error | null, session: { isValid: () => boolean } | null) => {
      if (err || !session?.isValid()) {
        resolve(null)
        return
      }
      resolve(user.getUsername())
    })
  })
}

export function signOut() {
  userPool.getCurrentUser()?.signOut()
}
