import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { palette, radius, type } from '../lib/theme'

type Props = {
  label: string
  help?: string
  options: string[]
  selected: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
}

export default function MultiSelectField({ label, help, options, selected, onChange, disabled = false }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const rows = needle ? options.filter(option => option.toLowerCase().includes(needle)) : options
    return rows.slice(0, 60)
  }, [options, query])

  function toggle(value: string) {
    if (disabled) return
    onChange(selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value])
  }

  return <View style={styles.section}>
    <Pressable disabled={disabled} onPress={() => setOpen(value => !value)} style={styles.heading}>
      <View style={styles.headingCopy}>
        <Text style={styles.label}>{label}</Text>
        {help ? <Text style={styles.help}>{help}</Text> : null}
      </View>
      <Text style={styles.count}>{selected.length ? `${selected.length} selected` : open ? 'Close' : 'Choose'}</Text>
    </Pressable>

    {selected.length ? <View style={styles.selectedWrap}>{selected.map(value => <Pressable disabled={disabled} key={value} onPress={() => toggle(value)} style={styles.selected}><Text style={styles.selectedText}>{value}{disabled ? '' : ' ×'}</Text></Pressable>)}</View> : null}

    {open && !disabled ? <View style={styles.picker}>
      <TextInput value={query} onChangeText={setQuery} placeholder={`Search ${label.toLowerCase()}…`} placeholderTextColor={palette.quiet} style={styles.search} />
      <View style={styles.options}>{filtered.map(value => {
        const active = selected.includes(value)
        return <Pressable key={value} onPress={() => toggle(value)} style={[styles.option, active && styles.optionActive]}><Text style={[styles.optionText, active && styles.optionTextActive]}>{active ? '✓ ' : ''}{value}</Text></Pressable>
      })}</View>
      {filtered.length === 0 ? <Text style={styles.empty}>No matching options.</Text> : null}
      {options.length > 60 && !query ? <Text style={styles.hint}>Search to see more options.</Text> : null}
    </View> : null}
  </View>
}

const styles = StyleSheet.create({
  section:{borderTopWidth:1,borderTopColor:palette.line,paddingVertical:15},
  heading:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',gap:12},
  headingCopy:{flex:1},
  label:{color:palette.inkStrong,fontSize:10.5,fontWeight:'700',fontFamily:type.sans},
  help:{color:palette.muted,fontSize:9.5,lineHeight:15,marginTop:3,fontFamily:type.sans},
  count:{color:palette.ink,fontSize:9,fontWeight:'700',paddingTop:1,fontFamily:type.sans},
  selectedWrap:{flexDirection:'row',flexWrap:'wrap',gap:6,marginTop:10},
  selected:{backgroundColor:palette.stoneDeep,paddingHorizontal:9,paddingVertical:7,borderRadius:radius.small},
  selectedText:{color:palette.inkStrong,fontSize:9,fontWeight:'600',fontFamily:type.sans},
  picker:{marginTop:11},
  search:{borderWidth:1,borderColor:palette.lineStrong,paddingHorizontal:11,paddingVertical:10,color:palette.text,fontSize:11,backgroundColor:palette.paper,borderRadius:radius.medium,fontFamily:type.sans},
  options:{flexDirection:'row',flexWrap:'wrap',gap:6,marginTop:9},
  option:{borderWidth:1,borderColor:palette.lineStrong,paddingHorizontal:9,paddingVertical:8,borderRadius:radius.small,backgroundColor:palette.paper},
  optionActive:{backgroundColor:palette.ink,borderColor:palette.ink},
  optionText:{color:palette.muted,fontSize:9,fontFamily:type.sans},
  optionTextActive:{color:palette.paper,fontWeight:'700'},
  empty:{color:palette.muted,fontSize:10,marginTop:10,fontFamily:type.sans},
  hint:{color:palette.quiet,fontSize:9,marginTop:9,fontFamily:type.sans},
})
