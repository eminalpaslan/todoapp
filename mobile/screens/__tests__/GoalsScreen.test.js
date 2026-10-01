import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import GoalsScreen from '../GoalsScreen';

jest.mock('../../components/ScreenHeader', () => {
  const { Text } = require('react-native');
  return function MockScreenHeader({ title }) {
    return <Text>{title}</Text>;
  };
});

jest.mock('../../services/todo', () => ({
  listTodos: jest.fn(),
  createTodo: jest.fn(),
  updateTodo: jest.fn(),
  deleteTodo: jest.fn(),
}));

const { createTodo, listTodos } = require('../../services/todo');

describe('GoalsScreen', () => {
  beforeEach(() => {
    listTodos.mockReset();
    createTodo.mockReset();
    listTodos.mockResolvedValue([]);
  });

  it('periyot bosken "hedef yok" mesaji gosterir', async () => {
    await render(<GoalsScreen />);

    expect(await screen.findByText('Bu periyotta hedef yok')).toBeTruthy();
    expect(listTodos).toHaveBeenCalledWith('daily');
  });

  it('yeni hedef eklenince listede gorunur', async () => {
    createTodo.mockResolvedValue({
      id: 1,
      title: 'Su iç',
      description: null,
      is_done: false,
      period: 'daily',
      created_at: '2026-10-01T00:00:00Z',
    });
    await render(<GoalsScreen />);
    await screen.findByText('Bu periyotta hedef yok');

    await fireEvent.changeText(screen.getByPlaceholderText('Yeni hedef...'), 'Su iç');
    await fireEvent.press(screen.getByText('Ekle'));

    await waitFor(() => expect(createTodo).toHaveBeenCalledWith({ title: 'Su iç', period: 'daily' }));
    expect(await screen.findByText('Su iç')).toBeTruthy();
  });
});
