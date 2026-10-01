import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import LoginScreen from '../LoginScreen';

jest.mock('../../services/auth', () => ({
  login: jest.fn(),
}));
jest.mock('../../services/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const { login } = require('../../services/auth');
const { useAuth } = require('../../services/AuthContext');

// Bu surumde @testing-library/react-native'in render/fireEvent fonksiyonlari
// async (React 19'un test-renderer'i act(async () => ...) kullaniyor) -
// hepsi await edilmeden cagrilirsa guncellemeler kaybolur / testler arasina sizar.
async function renderLoginScreen({ route = {} } = {}) {
  const navigation = { navigate: jest.fn() };
  await render(<LoginScreen navigation={navigation} route={route} />);
  return { navigation };
}

function isSubmitDisabled() {
  return screen.getByTestId('login-submit').props.accessibilityState.disabled;
}

describe('LoginScreen', () => {
  let signIn;

  beforeEach(() => {
    signIn = jest.fn();
    useAuth.mockReturnValue({ signIn });
    login.mockReset();
  });

  it('giris butonu bos formda devre disidir', async () => {
    await renderLoginScreen();
    expect(isSubmitDisabled()).toBe(true);
  });

  it('gecerli bilgilerle basarili giriste token saklanir', async () => {
    login.mockResolvedValue('sahte-token');
    await renderLoginScreen();

    await fireEvent.changeText(screen.getByPlaceholderText('E-posta'), 'test@example.com');
    await fireEvent.changeText(screen.getByPlaceholderText('Şifre'), 'sifre1234');
    await fireEvent.press(screen.getByTestId('login-submit'));

    await waitFor(() => expect(signIn).toHaveBeenCalledWith('sahte-token'));
    expect(login).toHaveBeenCalledWith('test@example.com', 'sifre1234');
    await waitFor(() => expect(isSubmitDisabled()).toBe(false));
  });

  it('basarisiz giriste hata mesaji gosterilir', async () => {
    login.mockRejectedValue({ response: { data: { detail: 'E-posta veya sifre hatali' } } });
    await renderLoginScreen();

    await fireEvent.changeText(screen.getByPlaceholderText('E-posta'), 'test@example.com');
    await fireEvent.changeText(screen.getByPlaceholderText('Şifre'), 'yanlis-sifre');
    await fireEvent.press(screen.getByTestId('login-submit'));

    expect(await screen.findByText('E-posta veya sifre hatali')).toBeTruthy();
    expect(signIn).not.toHaveBeenCalled();
  });
});
