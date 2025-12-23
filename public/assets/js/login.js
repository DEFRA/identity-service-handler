async function loginWithForm(event) {
  const auth0Client = new auth0.WebAuth({
    domain: 'dev-vkv82jrozs8ery4p.uk.auth0.com',
    clientID: 'asfodQ5mrhAiFwQu1UZZ3YsWI4U0Fwk8',
    redirectUri: 'http://localhost:3000/callback',
    responseType: 'code token id_token',
    responseMode: 'form_post',
    scope: 'openid profile email',
  })

  const username = document.getElementById('user_id').value;
  const password = document.getElementById('password').value;

  auth0Client.login(
    {
      email: username,
      password,
      realm: 'Username-Password-Authentication', // your DB connection name
    },
    function (err) {
      if (err) {
        console.error('Login failed', err);
        return;
      }
      // Auth0 will redirect to redirectUri on success
    }
  );
}

async function updateRole(delegateId, delegateUrl, primaryCph, service) {
  const auth0Client = new auth0.WebAuth({
    domain: 'dev-vkv82jrozs8ery4p.uk.auth0.com',
    clientID: 'asfodQ5mrhAiFwQu1UZZ3YsWI4U0Fwk8',
    redirectUri: 'http://localhost:3000/callback',
    responseType: 'code token id_token',
    responseMode: 'form_post',
    scope: 'openid profile email',
  })

  auth0Client.checkSession(
    {
      delegateId,
      delegateUrl,
      primaryCph,
      service
    },
    function (err) {
      if (err) {
        console.error('Login failed', err);
        return;
      }
      // Auth0 will redirect to redirectUri on success
    }
  );
}
