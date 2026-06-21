import requests

# Test login functionality
API_BASE_URL = 'http://localhost:8000/api'

def test_register():
    data = {
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'testpass123'
    }
    response = requests.post(f'{API_BASE_URL}/register', json=data)
    print(f'Register response: {response.status_code}')
    print(response.json())
    return response.status_code == 200

def test_login():
    data = {
        'username': 'testuser',
        'password': 'testpass123'
    }
    response = requests.post(f'{API_BASE_URL}/login', data=data)
    print(f'Login response: {response.status_code}')
    if response.status_code == 200:
        token_data = response.json()
        print(f'Token: {token_data}')
        return token_data.get('access_token')
    else:
        print(response.json())
        return None

def test_profile(token):
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(f'{API_BASE_URL}/profile', headers=headers)
    print(f'Profile response: {response.status_code}')
    print(response.json())
    return response.status_code == 200

def test_scores(token):
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(f'{API_BASE_URL}/games/scores', headers=headers)
    print(f'Scores response: {response.status_code}')
    print(response.json())
    return response.status_code == 200

if __name__ == '__main__':
    print('Testing login functionality...')
    if test_register():
        token = test_login()
        if token:
            test_profile(token)
            test_scores(token)
            print('All tests passed!')
        else:
            print('Login failed')
    else:
        print('Registration failed')