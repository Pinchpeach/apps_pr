import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { BriefingBlock } from '../data/news';

export function BriefingBody({ blocks }: { blocks: BriefingBlock[] }) {
  return <View style={styles.body}>{blocks.map((block, index) => {
    if (block.type === 'table') return <ScrollView key={index} horizontal style={styles.table}>
      <View>{block.rows.map((row, r) => <View key={r} style={[styles.row, r === 0 && styles.header]}>
        {row.map((cell, c) => <Text key={c} selectable style={[styles.cell, r === 0 && styles.bold]}>{cell}</Text>)}
      </View>)}</View>
    </ScrollView>;
    return <Text key={index} selectable style={block.type === 'heading' ? styles.heading : styles.paragraph}>{block.text}</Text>;
  })}</View>;
}
const styles = StyleSheet.create({
  body: { marginTop: 24 }, heading: { fontSize: 20, fontWeight: '800', marginTop: 22, marginBottom: 10, color: '#0f172a' },
  paragraph: { fontSize: 15, lineHeight: 25, color: '#334155', marginBottom: 10 },
  table: { marginVertical: 12, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }, header: { backgroundColor: '#f1f5f9' },
  cell: { width: 180, padding: 12, fontSize: 14, lineHeight: 22, color: '#334155' }, bold: { fontWeight: '800' },
});
