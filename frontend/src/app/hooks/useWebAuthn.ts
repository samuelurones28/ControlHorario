import { api } from '../services/api';

interface WebAuthnChallenge {
  challenge: string;
  rp: { name: string; id: string };
  user: { id: string; name: string; displayName: string };
  pubKeyCredParams: any[];
  authenticatorSelection: any;
  timeout: number;
  attestation: string;
}

interface AuthenticationOptions {
  challenge: string;
  allowCredentials: any[];
  userVerification: string;
  timeout: number;
  employeeId: string;
}

export const useWebAuthn = () => {
  // Check if WebAuthn is available
  const isWebAuthnSupported = () => {
    return (
      window.PublicKeyCredential !== undefined &&
      navigator.credentials !== undefined &&
      navigator.credentials.create !== undefined &&
      navigator.credentials.get !== undefined
    );
  };

  // Registration: Get challenge
  const getRegistrationChallenge = async (
    employeeId: string
  ): Promise<WebAuthnChallenge> => {
    const response = await api.post('/webauthn/register/options');
    return response.data;
  };

  // Registration: Register biometric
  const registerBiometric = async (employeeId: string, name?: string) => {
    if (!isWebAuthnSupported()) {
      throw new Error('WebAuthn not supported on this device');
    }

    try {
      // Step 1: Get challenge
      const options = await getRegistrationChallenge(employeeId);

      // Convert challenge from base64 to Uint8Array
      const challengeBuffer = Uint8Array.from(
        atob(options.challenge),
        c => c.charCodeAt(0)
      );

      // Create credential using WebAuthn API
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: challengeBuffer,
          rp: options.rp,
          user: {
            id: Uint8Array.from(atob(options.user.id), c => c.charCodeAt(0)),
            name: options.user.name,
            displayName: options.user.displayName,
          },
          pubKeyCredParams: options.pubKeyCredParams,
          authenticatorSelection: options.authenticatorSelection,
          timeout: options.timeout,
          attestation: options.attestation as any,
        },
      });

      if (!credential || credential.type !== 'public-key') {
        throw new Error('Failed to create credential');
      }

      const publicKeyCredential = credential as PublicKeyCredential;
      const response = publicKeyCredential.response as AuthenticatorAttestationResponse;

      // Step 2: Send credential to server
      const saveResponse = await api.post('/webauthn/register/verify', {
        credentialId: Buffer.from(publicKeyCredential.id).toString('base64'),
        publicKey: Buffer.from(response.attestationObject).toString('base64'),
        name: name || `Dispositivo ${new Date().toLocaleDateString('es-ES')}`,
      });

      return saveResponse.data;
    } catch (error) {
      const e = error as any;
      throw new Error(
        `Biometric registration failed: ${e.response?.data?.message || e.message}`
      );
    }
  };

  // Authentication: Get challenge
  const getAuthenticationChallenge = async (
    companyCode: string,
    identifier: string
  ): Promise<AuthenticationOptions> => {
    const response = await api.post('/webauthn/authenticate/options', {
      companyCode,
      identifier,
    });
    return response.data;
  };

  // Authentication: Authenticate with biometric
  const authenticateWithBiometric = async (
    companyCode: string,
    identifier: string
  ) => {
    if (!isWebAuthnSupported()) {
      throw new Error('WebAuthn not supported on this device');
    }

    try {
      // Step 1: Get challenge
      const options = await getAuthenticationChallenge(companyCode, identifier);

      const challengeBuffer = Uint8Array.from(
        atob(options.challenge),
        c => c.charCodeAt(0)
      );

      // Get assertion using WebAuthn API
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: challengeBuffer,
          allowCredentials: options.allowCredentials.map((cred: any) => ({
            id: Uint8Array.from(atob(cred.id), c => c.charCodeAt(0)),
            type: 'public-key',
            transports: cred.transports,
          })),
          userVerification: options.userVerification as any,
          timeout: options.timeout,
        },
      });

      if (!assertion || assertion.type !== 'public-key') {
        throw new Error('Authentication failed');
      }

      const publicKeyAssertion = assertion as PublicKeyCredential;

      // Step 2: Send assertion to server
      const authResponse = await api.post('/webauthn/authenticate/verify', {
        credentialId: Buffer.from(publicKeyAssertion.id).toString('base64'),
        employeeId: options.employeeId,
      });

      return authResponse.data;
    } catch (error) {
      const e = error as any;
      throw new Error(
        `Biometric authentication failed: ${e.response?.data?.message || e.message}`
      );
    }
  };

  // List credentials
  const listCredentials = async () => {
    const response = await api.get('/webauthn/credentials');
    return response.data.credentials;
  };

  // Delete credential
  const deleteCredential = async (credentialId: string) => {
    const response = await api.delete(`/webauthn/credentials/${credentialId}`);
    return response.data;
  };

  return {
    isWebAuthnSupported,
    registerBiometric,
    authenticateWithBiometric,
    listCredentials,
    deleteCredential,
  };
};
