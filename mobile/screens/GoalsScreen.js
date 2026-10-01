import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import ScreenHeader from '../components/ScreenHeader';
import { getErrorMessage } from '../services/api';
import { PERIOD_LABELS } from '../services/periods';
import { createTodo, deleteTodo, listTodos, updateTodo } from '../services/todo';

const PERIODS = ['daily', 'weekly', 'monthly', 'yearly'];

export default function GoalsScreen() {
  const [period, setPeriod] = useState('daily');
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const loadGoals = useCallback(async (selectedPeriod) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listTodos(selectedPeriod);
      setGoals(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGoals(period);
  }, [period, loadGoals]);

  async function handleAdd() {
    if (!newTitle.trim()) return;
    setIsAdding(true);
    try {
      const goal = await createTodo({ title: newTitle.trim(), period });
      setGoals((prev) => [goal, ...prev]);
      setNewTitle('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsAdding(false);
    }
  }

  async function toggleDone(goal) {
    const updated = await updateTodo(goal.id, { is_done: !goal.is_done });
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? updated : g)));
  }

  async function removeGoal(goal) {
    await deleteTodo(goal.id);
    setGoals((prev) => prev.filter((g) => g.id !== goal.id));
  }

  const visibleGoals = goals.filter((g) =>
    g.title.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Hedefler" />

      <View style={styles.periodRow}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => setPeriod(p)}
            style={[styles.chip, period === p && styles.chipActive]}
          >
            <Text style={[styles.chipText, period === p && styles.chipTextActive]}>
              {PERIOD_LABELS[p]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.search}
        placeholder="Hedeflerde ara..."
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          placeholder="Yeni hedef..."
          value={newTitle}
          onChangeText={setNewTitle}
          onSubmitEditing={handleAdd}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAdd}
          disabled={isAdding || !newTitle.trim()}
        >
          <Text style={styles.addButtonText}>Ekle</Text>
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {isLoading ? (
        <ActivityIndicator style={styles.loading} />
      ) : (
        <FlatList
          data={visibleGoals}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Bu periyotta hedef yok</Text>}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <TouchableOpacity style={styles.checkbox} onPress={() => toggleDone(item)}>
                <Text>{item.is_done ? '☑' : '☐'}</Text>
              </TouchableOpacity>
              <Text style={[styles.rowTitle, item.is_done && styles.rowTitleDone]}>
                {item.title}
              </Text>
              <TouchableOpacity onPress={() => removeGoal(item)}>
                <Text style={styles.delete}>Sil</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  periodRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  chipActive: { backgroundColor: '#2563eb' },
  chipText: { color: '#334155', fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
  search: {
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
  },
  addRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, gap: 8 },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
  },
  addButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  error: { color: '#dc2626', marginHorizontal: 16, marginTop: 8 },
  loading: { marginTop: 24 },
  list: { padding: 16 },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 10,
  },
  checkbox: { width: 24 },
  rowTitle: { flex: 1, fontSize: 15 },
  rowTitleDone: { textDecorationLine: 'line-through', color: '#94a3b8' },
  delete: { color: '#dc2626' },
});
