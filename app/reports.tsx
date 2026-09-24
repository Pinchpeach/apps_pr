import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getReport, MarketReport } from '../src/services/reportService';

export default function Reports() {
  const [period,setPeriod] = useState<'daily'|'weekly'|'monthly'>('weekly');
  const [data,setData] = useState<MarketReport|null>(null);
  const [error,setError] = useState('');
  useEffect(() => {
    let active = true;
    setData(null); setError('');
    getReport(period).then(result => { if(active) setData(result); }).catch(e => { if(active) setError(e.message); });
    return () => { active = false; };
  },[period]);
  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page}>
    <TouchableOpacity onPress={()=>router.back()}><Text>‹ 홈</Text></TouchableOpacity>
    <Text style={s.h1}>경제 브리핑</Text>
    <View style={s.tabs}>{([['daily','일간'],['weekly','주간'],['monthly','월간']] as const).map(([p,t])=>
      <TouchableOpacity accessibilityRole="button" key={p} onPress={()=>setPeriod(p)} style={[s.tab,period===p&&s.on]}><Text style={period===p?s.onText:undefined}>{t}</Text></TouchableOpacity>
    )}</View>
    {error?<Text accessibilityRole="alert" style={s.copy}>{error}</Text>:!data?<ActivityIndicator style={{margin:40}}/>:<>
      <View style={s.hero}>
        <Text style={s.label}>{data.source ?? period.toUpperCase()+' REPORT'}</Text>
        <Text style={s.white}>{data.summary}</Text>
        <Text style={s.copy}>{data.source ? (data.reportDate ? data.reportDate+' 발행' : '보고서 없음') : new Date(data.generatedAt).toLocaleString()+' 기준'}</Text>
        {data.importedAt?<Text style={s.copy}>{new Date(data.importedAt).toLocaleDateString()} 가져옴 · 자동 동기화 없음</Text>:null}
      </View>
      {data.highlights.length ? <>
        <Text style={s.h2}>아카이브 섹터</Text>
        {data.categories.map(x=><View style={s.row} key={x.name}><Text style={s.bold}>{x.name}</Text><Text style={s.val}>{x.count}건</Text></View>)}
        <Text style={s.h2}>브리핑 목록</Text>
        {data.highlights.map(x=><TouchableOpacity key={x.id} style={s.card} onPress={()=>router.push({pathname:'/article',params:{id:x.id}})}><Text style={s.bold}>{x.title}</Text><Text style={s.copy}>{x.summary}</Text></TouchableOpacity>)}
      </> : null}
    </>}
  </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:'#f6f8fb'},page:{padding:22,maxWidth:900,width:'100%',alignSelf:'center'},h1:{fontSize:30,fontWeight:'900',marginTop:18},tabs:{flexDirection:'row',gap:8,marginTop:18},tab:{paddingHorizontal:16,paddingVertical:10,borderRadius:18,backgroundColor:'#e8edf4'},on:{backgroundColor:'#1468e8'},onText:{color:'white',fontWeight:'800'},hero:{backgroundColor:'#0d2340',padding:22,borderRadius:22,marginTop:20},label:{color:'#69a7ff',fontWeight:'900'},white:{color:'white',fontSize:21,fontWeight:'900',marginTop:8,lineHeight:30},copy:{color:'#94a3b8',lineHeight:21,marginTop:8},h2:{fontSize:20,fontWeight:'900',marginTop:26,marginBottom:8},row:{backgroundColor:'white',padding:18,borderRadius:15,marginTop:8,flexDirection:'row',justifyContent:'space-between'},bold:{fontWeight:'800'},val:{fontWeight:'900',color:'#1468e8'},card:{backgroundColor:'white',padding:18,borderRadius:16,marginTop:8}});
