import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import ScreenHeader from '../components/ScreenHeader';
import { listHabits, listCheckIns } from '../services/habit';
import { currentPeriodKey } from '../services/periods';
import { listTodos } from '../services/todo';

export default function HomeScreen() {
  const [dailyGoals, setDailyGoals] = useState([]);
  const [weeklyGoals, setWeeklyGoals] = useState([]);
  const [dailyHabitsDone, setDailyHabitsDone] = useState(0);
  const [dailyHabitsTotal, setDailyHabitsTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const [daily, weekly, habits] = await Promise.all([
      listTodos('daily'),
      listTodos('weekly'),
      listHabits(),
    ]);
    setDailyGoals(daily);
    setWeeklyGoals(weekly);

    const dailyHabits = habits.filter((h) => h.period === 'daily');
    const checkedCount = (
      await Promise.all(
        dailyHabits.map(async (h) => {
          const checkIns = await listCheckIns(h.id);
          const key = currentPeriodKey('daily');
          return checkIns.some((c) => c.period_key === key) ? 1 : 0;
        })
      )
    ).reduce((a, b) => a + b, 0);
    setDailyHabitsDone(checkedCount);
    setDailyHabitsTotal(dailyHabits.length);

    setIsLoading(false);
  }, []);

  // useEffect(mount'ta bir kez) degil: tab navigator ekranlari canli tutuyor,
  // Hedefler/Alışkanlıklar'da yapilan degisikligin Ana Sayfa'ya yansimasi icin
  // her odaklanmada (sekmeye her donuste) yeniden veri cekiliyor.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const doneGoals = dailyGoals.filter((g) => g.is_done).length;
  const totalItems = dailyGoals.length + dailyHabitsTotal;
  const doneItems = doneGoals + dailyHabitsDone;
  const progress = totalItems === 0 ? 0 : Math.round((doneItems / totalItems) * 100);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Ana Sayfa" />
        <ActivityIndicator style={styles.loading} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Ana Sayfa" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.progressCard}>
          <Text style={styles.progressValue}>%{progress}</Text>
          <Text style={styles.progressLabel}>
            Bugünün ilerlemesi ({doneItems}/{totalItems || 0})
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Bugünün Hedefleri</Text>
        {dailyGoals.length === 0 ? (
          <Text style={styles.empty}>Bugün için hedef yok</Text>
        ) : (
          dailyGoals.map((g) => (
            <Text key={g.id} style={[styles.item, g.is_done && styles.itemDone]}>
              {g.is_done ? '☑' : '☐'} {g.title}
            </Text>
          ))
        )}

        <Text style={styles.sectionTitle}>Haftalık Hedefler</Text>
        {weeklyGoals.length === 0 ? (
          <Text style={styles.empty}>Bu hafta için hedef yok</Text>
        ) : (
          weeklyGoals.map((g) => (
            <Text key={g.id} style={[styles.item, g.is_done && styles.itemDone]}>
              {g.is_done ? '☑' : '☐'} {g.title}
            </Text>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loading: { marginTop: 24 },
  content: { padding: 16 },
  progressCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  progressValue: { fontSize: 36, fontWeight: 'bold', color: '#2563eb' },
  progressLabel: { color: '#475569', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 12, marginBottom: 8 },
  item: { fontSize: 15, paddingVertical: 4 },
  itemDone: { textDecorationLine: 'line-through', color: '#94a3b8' },
  empty: { color: '#94a3b8' },
});
