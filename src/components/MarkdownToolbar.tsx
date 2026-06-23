import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface SelectionState {
  start: number;
  end: number;
}

interface MarkdownToolbarProps {
  onInsert: (before: string, after: string, cursorOffset?: number) => void;
  selection: SelectionState;
  text: string;
}

interface ToolDef {
  key: string;
  label: string;
  before: string;
  after: string;
  cursorOffset?: number;
  bold?: boolean;
  italic?: boolean;
}

const TOOLS: ToolDef[] = [
  { key: 'bold', label: 'B', bold: true, before: '**', after: '**' },
  { key: 'italic', label: 'I', italic: true, before: '*', after: '*' },
  { key: 'heading', label: 'H#', before: '### ', after: '', cursorOffset: 0 },
  { key: 'bullet', label: '•', before: '- ', after: '', cursorOffset: 0 },
  { key: 'numbered', label: '1.', before: '1. ', after: '', cursorOffset: 0 },
];

export default function MarkdownToolbar({ onInsert, selection, text }: MarkdownToolbarProps) {
  const { colors } = useTheme();

  const handleTool = (tool: ToolDef) => {
    const selectedText = text.substring(selection.start, selection.end);
    const before = tool.before;
    const after = tool.after;

    if (selectedText) {
      onInsert(`${before}${selectedText}${after}`, '');
    } else {
      const placeholder = tool.key === 'heading' ? 'Heading' : tool.key === 'bold' ? 'bold' : tool.key === 'italic' ? 'italic' : tool.key === 'bullet' ? 'item' : 'item';
      onInsert(`${before}${placeholder}${after}`, '', before.length);
    }
  };

  return (
    <View style={[styles.toolbar, { backgroundColor: colors.bg.cardSecondary, borderColor: colors.border }]}>
      {TOOLS.map(tool => (
        <TouchableOpacity
          key={tool.key}
          style={[styles.toolBtn, { backgroundColor: colors.bg.card }]}
          onPress={() => handleTool(tool)}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          accessibilityLabel={tool.key}
          accessibilityRole="button"
        >
          <Text style={[
            { color: colors.text.ink, fontSize: 14, lineHeight: 16 },
            tool.bold ? { fontWeight: '800' } : {},
            tool.italic ? { fontStyle: 'italic' } : {},
          ]}>
            {tool.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    gap: 6,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  toolBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
