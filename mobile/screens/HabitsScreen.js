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
import {
  createCheckIn,
  createHabit,
  deleteCheckIn,
  deleteHabit,
  listCheckIns,
  listHabits,
} from '../services/habit';
import { PERIOD_LABELS, currentPeriodKey } from '../services/periods';

const PERIODS = ['daily', 'weekly', 'monthly'];

export default function HabitsScreen() {
  const [habits, setHabits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [newPeriod, setNewPeriod] = useState('daily');
  const [isAdding, setIsAdding] = useState(false);

  const loadHabits = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await listHabits();
      // Her alışkanlık için "bu periyotta işaretlendi mi" bilgisini ekle
      const withStatus = await Promise.all(
        list.map(async (habit) => {
          const checkIns = await listCheckIns(habit.id);
          const key = currentPeriodKey(habit.period);
          return { ...habit, isCheckedNow: checkIns.some((c) => c.period_key === key) };
        })
      );
      setHabits(withStatus);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  async function handleAdd() {
    if (!newName.trim()) return;
    setIsAdding(true);
    try {
      const habit = await createHabit({ name: newName.trim(), period: newPeriod });
      setHabits((prev) => [{ ...habit, isCheckedNow: false }, ...prev]);
      setNewName('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsAdding(false);
    }
  }

  async function toggleCheckIn(habit) {
    const key = currentPeriodKey(habit.period);
    if (habit.isCheckedNow) {
      await deleteCheckIn(habit.id, key);
    } else {
      await createCheckIn(habit.id, key);
    }
    setHabits((prev) =>
      prev.map((h) => (h.id === habit.id ? { ...h, isCheckedNow: !h.isCheckedNow } : h))
    );
  }

  async function removeHabit(habit) {
    await deleteHabit(habit.id);
    setHabits((prev) => prev.filter((h) => h.id !== habit.id));
  }

  const visibleHabits = habits.filter((h) =>
    h.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Alışkanlıklar" />

      <TextInput
        style={styles.search}
        placeholder="Alışkanlıklarda ara..."
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          placeholder="Yeni alışkanlık..."
          value={newName}
          onChangeText={setNewName}
          onSubmitEditing={handleAdd}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAdd}
          disabled={isAdding || !newName.trim()}
        >
          <Text style={styles.addButtonText}>Ekle</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.periodRow}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => setNewPeriod(p)}
            style={[styles.chip, newPeriod === p && styles.chipActive]}
          >
            <Text style={[styles.chipText, newPeriod === p && styles.chipTextActive]}>
              {PERIOD_LABELS[p]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {isLoading ? (
        <ActivityIndicator style={styles.loading} />
      ) : (
        <FlatList
          data={visibleHabits}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Henüz alışkanlık yok</Text>}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <TouchableOpacity style={styles.checkbox} onPress={() => toggleCheckIn(item)}>
                <Text>{item.isCheckedNow ? '☑' : '☐'}</Text>
              </TouchableOpacity>
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowTitle}>{item.name}</Text>
                <Text style={styles.rowPeriod}>{PERIOD_LABELS[item.period]}</Text>
              </View>
              <TouchableOpacity onPress={() => removeHabit(item)}>
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
  periodRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 10, gap: 8 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  chipActive: { backgroundColor: '#2563eb' },
  chipText: { color: '#334155', fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
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
  rowTextWrap: { flex: 1 },
  rowTitle: { fontSize: 15 },
  rowPeriod: { fontSize: 12, color: '#94a3b8' },
  delete: { color: '#dc2626' },
});
