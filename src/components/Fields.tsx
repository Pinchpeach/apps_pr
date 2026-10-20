import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { koreanAmount } from '@/format';
import { useTheme } from '@/theme';

function Label({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  const t = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: t.text }]}>{label}</Text>
      {children}
      {hint ? <Text style={[styles.hint, { color: t.muted }]}>{hint}</Text> : null}
    </View>
  );
}

/** 원 단위 금액 입력: 천 단위 콤마와 한글 금액 표시 */
export function MoneyField({ label, value, onChange, hint }: { label: string; value: number; onChange: (v: number) => void; hint?: string }) {
  const t = useTheme();
  return (
    <Label label={label} hint={hint}>
      <View style={[styles.inputRow, { backgroundColor: t.bg, borderColor: t.line }]}>
        <TextInput
          accessibilityLabel={label}
          style={[styles.input, { color: t.text }]}
          keyboardType="number-pad"
          value={value ? value.toLocaleString('ko-KR') : ''}
          placeholder="0"
          placeholderTextColor={t.muted}
          onChangeText={(text) => onChange(Number(text.replace(/[^\d]/g, '')) || 0)}
        />
        <Text style={[styles.unit, { color: t.muted }]}>원</Text>
      </View>
      <Text style={[styles.amount, { color: t.muted }]}>{value ? koreanAmount(value) : ' '}</Text>
    </Label>
  );
}

/** 글자 입력 (지급처, 날짜 등) */
export function TextField({ label, value, onChange, placeholder, hint }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string }) {
  const t = useTheme();
  return (
    <Label label={label} hint={hint}>
      <View style={[styles.inputRow, { backgroundColor: t.bg, borderColor: t.line }]}>
        <TextInput
          accessibilityLabel={label}
          style={[styles.input, { color: t.text, textAlign: 'left' }]}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={t.muted}
          onChangeText={onChange}
        />
      </View>
    </Label>
  );
}

/** 소수 허용 숫자 입력 (비율·인원 등) */
export function NumberField({
  label,
  value,
  onChange,
  unit,
  hint,
  decimal = false,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit: string;
  hint?: string;
  decimal?: boolean;
}) {
  const t = useTheme();
  const [text, setText] = useState(String(value));
  // 외부에서 값이 바뀌면(업종 프리셋 등) 입력란도 따라간다. 단, 비운 칸이나 "3." 처럼 입력 중인 글자는 그대로 둔다.
  const pending = text === '' || text === '.' || text.endsWith('.');
  const shown = pending || Number(text) === value ? text : String(value);
  return (
    <Label label={label} hint={hint}>
      <View style={[styles.inputRow, { backgroundColor: t.bg, borderColor: t.line }]}>
        <TextInput
          accessibilityLabel={label}
          style={[styles.input, { color: t.text }]}
          keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
          value={shown}
          onChangeText={(next) => {
            const clean = next.replace(decimal ? /[^\d.]/g : /[^\d]/g, '');
            setText(clean);
            onChange(Number(clean) || 0);
          }}
        />
        <Text style={[styles.unit, { color: t.muted }]}>{unit}</Text>
      </View>
    </Label>
  );
}

/** 선택지 버튼 묶음 */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label?: string;
  options: readonly (readonly [T, string])[];
  value: T;
  onChange: (v: T) => void;
}) {
  const t = useTheme();
  return (
    <View style={styles.field}>
      {label ? <Text style={[styles.label, { color: t.text }]}>{label}</Text> : null}
      <View style={styles.segments} role="radiogroup" aria-label={label}>
        {options.map(([key, text]) => {
          const active = key === value;
          return (
            <Pressable
              key={key}
              role="radio"
              aria-checked={active}
              onPress={() => onChange(key)}
              style={[
                styles.segment,
                { borderColor: active ? t.accent : t.line, backgroundColor: active ? t.accentSoft : t.bg },
              ]}>
              <Text style={[styles.segmentText, { color: active ? t.accent : t.text, fontWeight: active ? '700' : '500' }]}>{text}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const t = useTheme();
  return (
    <Pressable role="checkbox" aria-checked={value} aria-label={label} onPress={() => onChange(!value)} style={styles.toggle}>
      <View style={[styles.box, { borderColor: value ? t.accent : t.line, backgroundColor: value ? t.accent : 'transparent' }]}>
        {value ? <Text style={{ color: t.onAccent, fontWeight: '800', fontSize: 13 }}>✓</Text> : null}
      </View>
      <Text style={{ color: t.text, flex: 1 }}>{label}</Text>
    </Pressable>
  );
}

/** 접었다 펴는 고급 입력 */
export function Collapsible({ title, children }: { title: string; children: ReactNode }) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={[styles.collapsible, { borderColor: t.line }]}>
      <Pressable role="button" aria-expanded={open} onPress={() => setOpen(!open)}>
        <Text style={{ color: t.accent, fontWeight: '700' }}>
          {open ? '▾' : '▸'} {title}
        </Text>
      </Pressable>
      {open ? <View style={{ gap: 14, marginTop: 14 }}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600' },
  hint: { fontSize: 12, lineHeight: 17 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12 },
  input: { flex: 1, fontSize: 18, paddingVertical: 12, paddingHorizontal: 14, textAlign: 'right', fontVariant: ['tabular-nums'] },
  unit: { paddingRight: 14, fontSize: 15 },
  amount: { fontSize: 12, textAlign: 'right' },
  segments: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  segment: { flexGrow: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 },
  segmentText: { textAlign: 'center', fontSize: 14 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  collapsible: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, padding: 12 },
});
