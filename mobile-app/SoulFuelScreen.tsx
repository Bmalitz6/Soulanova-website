import React,{useEffect,useMemo,useState} from 'react';
import {Alert,ScrollView,StyleSheet,Text,TextInput,TouchableOpacity,View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Ionicons} from '@expo/vector-icons';

const teal='#086B63',dark='#173238',key='soulanova-soulfuel-diary-v1';
type Food={name:string;calories:number;protein:number;carbs:number;fat:number;portion:string};
type Entry=Food&{id:string;day:string;meal:string};
const foods:Food[]=[
 {name:'Egg, large',portion:'1 egg',calories:72,protein:6.3,carbs:0.4,fat:4.8},
 {name:'Banana, medium',portion:'1 banana',calories:105,protein:1.3,carbs:27,fat:0.4},
 {name:'Greek yogurt, plain nonfat',portion:'170 g',calories:100,protein:17,carbs:6,fat:0},
 {name:'Oatmeal, cooked',portion:'1 cup',calories:154,protein:6,carbs:27,fat:3},
 {name:'Salmon, cooked',portion:'100 g',calories:206,protein:22,carbs:0,fat:12},
 {name:'Chicken breast, cooked',portion:'100 g',calories:165,protein:31,carbs:0,fat:3.6},
 {name:'Brown rice, cooked',portion:'1 cup',calories:216,protein:5,carbs:45,fat:1.8},
 {name:'Olive oil',portion:'1 tablespoon',calories:119,protein:0,carbs:0,fat:13.5},
 {name:'Avocado',portion:'1/2 medium',calories:160,protein:2,carbs:9,fat:15},
 {name:'Apple, medium',portion:'1 apple',calories:95,protein:0.5,carbs:25,fat:0.3},
 {name:'Chickpeas, cooked',portion:'1/2 cup',calories:135,protein:7,carbs:22,fat:2},
 {name:'Spinach, raw',portion:'1 cup',calories:7,protein:0.9,carbs:1.1,fat:0.1}
];
const recipes=[
 {title:'Mediterranean Chickpea Bowl',description:'Chickpeas, greens, cucumber, tomato and lemon-olive oil dressing.',time:'15 min',ingredients:['1/2 cup chickpeas','1 cup spinach','1/2 cup cucumber and tomatoes','2 tsp olive oil','Lemon juice, herbs'],steps:['Rinse and drain chickpeas.','Chop vegetables and layer over greens.','Whisk oil, lemon and herbs; toss and serve.']},
 {title:'Lemon Herb Salmon',description:'Roasted salmon with lemon, parsley and a simple side salad.',time:'25 min',ingredients:['1 salmon fillet (about 150 g)','1 tsp olive oil','Lemon, parsley, garlic','Mixed greens'],steps:['Heat oven to 400°F / 205°C.','Brush salmon with oil, lemon and herbs.','Bake until salmon reaches 145°F / 63°C internally; serve with greens.']},
 {title:'Greek Yogurt Breakfast Bowl',description:'Plain yogurt with berries, oats and cinnamon.',time:'5 min',ingredients:['170 g plain Greek yogurt','1/2 cup berries','2 tbsp rolled oats','Cinnamon'],steps:['Add yogurt to a bowl.','Top with berries, oats and cinnamon.','Serve immediately.']}
];
const dayKey=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const fmt=(n:number)=>Math.round(n).toLocaleString();
export default function SoulFuelScreen({onBack}:{onBack:()=>void}){
 const [section,setSection]=useState<'home'|'recipes'|'diary'|'lookup'|'recipe'>('home');
 const [entries,setEntries]=useState<Entry[]>([]);
 const [loaded,setLoaded]=useState(false);
 const [search,setSearch]=useState('');
 const [meal,setMeal]=useState('Lunch');
 const [selected,setSelected]=useState(0);
 const [manual,setManual]=useState({name:'',portion:'1 serving',calories:'',protein:'',carbs:'',fat:''});
 useEffect(()=>{let valid=true;void AsyncStorage.getItem(key).then(raw=>{if(valid&&raw){try{const a=JSON.parse(raw);if(Array.isArray(a))setEntries(a)}catch{}}}).finally(()=>{if(valid)setLoaded(true)});return()=>{valid=false}},[]);
 useEffect(()=>{if(loaded)void AsyncStorage.setItem(key,JSON.stringify(entries)).catch(()=>Alert.alert('Storage problem','Your food diary could not be saved locally.'))},[entries,loaded]);
 const today=dayKey();
 const todays=entries.filter(e=>e.day===today);
 const totals=useMemo(()=>todays.reduce((a,e)=>({calories:a.calories+e.calories,protein:a.protein+e.protein,carbs:a.carbs+e.carbs,fat:a.fat+e.fat}),{calories:0,protein:0,carbs:0,fat:0}),[entries,today]);
 const add=(food:Food)=>{setEntries(old=>[...old,{...food,id:Date.now().toString()+Math.random().toString(36).slice(2),day:dayKey(),meal}]);Alert.alert('Added to Food Diary',food.name);};
 const remove=(id:string)=>Alert.alert('Remove food?','Remove this entry from today?', [{text:'Cancel',style:'cancel'},{text:'Remove',style:'destructive',onPress:()=>setEntries(a=>a.filter(e=>e.id!==id))}]);
 const addCustom=()=>{
  const kcal=Number(manual.calories),protein=Number(manual.protein||0),carbs=Number(manual.carbs||0),fat=Number(manual.fat||0);
  if(!manual.name.trim()||!manual.calories.trim()||[kcal,protein,carbs,fat].some(x=>!Number.isFinite(x)||x<0||x>10000)){Alert.alert('Check your entry','Enter a food name, valid calories and optional nutrient amounts.');return}
  add({name:manual.name.trim(),portion:manual.portion.trim()||'1 serving',calories:kcal,protein,carbs,fat});
  setManual({name:'',portion:'1 serving',calories:'',protein:'',carbs:'',fat:''});
 };
 const tile=(name:string,detail:string,icon:React.ComponentProps<typeof Ionicons>['name'],to:typeof section)=><TouchableOpacity accessibilityRole="button" onPress={()=>setSection(to)} style={styles.tile}><View style={styles.tileIcon}><Ionicons name={icon} size={23} color={teal}/></View><View style={{flex:1}}><Text style={styles.tileTitle}>{name}</Text><Text style={styles.sub}>{detail}</Text></View><Ionicons name="chevron-forward" size={20} color={teal}/></TouchableOpacity>;
 const foodRow=(food:Food)=><TouchableOpacity key={food.name} onPress={()=>add(food)} style={styles.foodRow}><View style={{flex:1}}><Text style={styles.foodName}>{food.name}</Text><Text style={styles.sub}>{food.portion} · {fmt(food.calories)} kcal · {food.protein} g protein</Text></View><Ionicons name="add-circle-outline" color={teal} size={27}/></TouchableOpacity>;
 return <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
  <TouchableOpacity onPress={()=>section==='home'?onBack():setSection('home')}><Text style={styles.back}>‹ {section==='home'?'Soulanova':'SoulFuel Home'}</Text></TouchableOpacity>
  <Text style={styles.title}>SoulFuel</Text><Text style={styles.intro}>Nourish your body. Enjoy your food.</Text>
  {section==='home'&&<>
   <View style={styles.card}><Text style={styles.heading}>Today's Nutrition</Text><Text style={styles.sub}>Food logged today · {new Date().toLocaleDateString()}</Text>
    <Text style={styles.calories}>{fmt(totals.calories)} <Text style={styles.calUnit}>kcal</Text></Text>
    <View style={styles.metrics}>{([{title:'Protein',value:totals.protein},{title:'Carbs',value:totals.carbs},{title:'Fat',value:totals.fat}]).map(m=><View key={m.title} style={styles.metric}><Text style={styles.metricNum}>{fmt(m.value)}g</Text><Text style={styles.sub}>{m.title}</Text></View>)}</View>
    <Text style={styles.note}>Totals reflect foods you log, not a calorie goal or exercise calories.</Text>
   </View>
   {tile('Food Diary','Log meals and review today’s intake','restaurant-outline','diary')}
   {tile('Food Lookup','Search a starter food list or enter your own','search-outline','lookup')}
   {tile('Recipes','Mediterranean meal inspiration','book-outline','recipes')}
  </>}
  {section==='diary'&&<>
   <Text style={styles.heading}>Today's Food Diary</Text><Text style={styles.sub}>{fmt(totals.calories)} kcal logged today</Text>
   {todays.length===0&&<Text style={styles.note}>No foods recorded yet. Tap Add Food to get started.</Text>}
   {['Breakfast','Lunch','Dinner','Snack'].map(m=><View key={m} style={styles.card}><Text style={styles.heading}>{m}</Text>{todays.filter(e=>e.meal===m).map(e=><TouchableOpacity key={e.id} onPress={()=>remove(e.id)} style={styles.foodRow}><View style={{flex:1}}><Text style={styles.foodName}>{e.name}</Text><Text style={styles.sub}>{e.portion} · {fmt(e.calories)} kcal</Text></View><Ionicons name="trash-outline" size={19} color="#9B4545"/></TouchableOpacity>)}</View>)}
   <TouchableOpacity style={styles.button} onPress={()=>setSection('lookup')}><Text style={styles.buttonText}>Add Food</Text></TouchableOpacity>
  </>}
  {section==='lookup'&&<>
   <Text style={styles.heading}>Food Lookup</Text><Text style={styles.note}>Starter reference foods only. Values are approximate and vary by brand and preparation. Confirm nutrition labels for precision.</Text>
   <Text style={styles.label}>Add to meal</Text><View style={styles.mealRow}>{['Breakfast','Lunch','Dinner','Snack'].map(m=><TouchableOpacity key={m} onPress={()=>setMeal(m)} style={[styles.chip,meal===m&&styles.chipActive]}><Text style={[styles.chipText,meal===m&&styles.chipTextActive]}>{m}</Text></TouchableOpacity>)}</View>
   <TextInput placeholder="Search foods…" style={styles.input} value={search} onChangeText={setSearch} accessibilityLabel="Search foods"/>
   {foods.filter(f=>f.name.toLowerCase().includes(search.trim().toLowerCase())).map(foodRow)}
   <View style={styles.card}><Text style={styles.heading}>Add a Food Manually</Text>
    {(['name','portion','calories','protein','carbs','fat'] as const).map(field=><TextInput key={field} accessibilityLabel={field} placeholder={field==='name'?'Food name':field==='portion'?'Portion (e.g., 1 cup)':field==='calories'?'Calories (required)':field.charAt(0).toUpperCase()+field.slice(1)+' grams (optional)'} keyboardType={['calories','protein','carbs','fat'].includes(field)?'decimal-pad':'default'} style={styles.input} value={manual[field]} onChangeText={v=>setManual(prev=>({...prev,[field]:v}))}/>)}
    <TouchableOpacity style={styles.button} onPress={addCustom}><Text style={styles.buttonText}>Save Food to Diary</Text></TouchableOpacity>
   </View>
  </>}
  {section==='recipes'&&<>{recipes.map((r,i)=><TouchableOpacity key={r.title} style={styles.tile} onPress={()=>{setSelected(i);setSection('recipe')}}><View style={{flex:1}}><Text style={styles.tileTitle}>{r.title}</Text><Text style={styles.sub}>{r.time} · {r.description}</Text></View><Ionicons name="chevron-forward" color={teal} size={20}/></TouchableOpacity>)}<Text style={styles.note}>Recipes are starter ideas. Nutritional values are not calculated until ingredient quantities and portions are verified.</Text></>}
  {section==='recipe'&&<View style={styles.card}><Text style={styles.heading}>{recipes[selected].title}</Text><Text style={styles.sub}>{recipes[selected].description} · {recipes[selected].time}</Text><Text style={styles.label}>Ingredients</Text>{recipes[selected].ingredients.map(x=><Text key={x} style={styles.recipeItem}>• {x}</Text>)}<Text style={styles.label}>Directions</Text>{recipes[selected].steps.map((x,i)=><Text key={x} style={styles.recipeItem}>{i+1}. {x}</Text>)}<Text style={styles.note}>Recipe nutrition is not yet calculated. Log each ingredient or use its verified label to track calories.</Text></View>}
  <Text style={styles.footer}>Food diary entries are currently stored on this device only. Account sync, barcode scanning, and a verified nutrition database are planned for later versions.</Text>
 </ScrollView>
}
const styles=StyleSheet.create({
 page:{flex:1,backgroundColor:'#F7F8F5'},content:{paddingHorizontal:20,paddingTop:75,paddingBottom:50},back:{color:teal,fontWeight:'700',fontSize:16,marginBottom:15},title:{color:dark,fontSize:34,fontWeight:'800'},intro:{fontSize:15,color:'#748A80',marginTop:5,marginBottom:20},
 card:{backgroundColor:'white',borderRadius:18,padding:19,marginBottom:14,borderWidth:1,borderColor:'#E0EAE4'},heading:{fontSize:21,fontWeight:'800',color:dark,marginBottom:8},calories:{fontSize:40,fontWeight:'800',color:teal,marginTop:10},calUnit:{fontSize:15,fontWeight:'600'},metrics:{flexDirection:'row',gap:8,marginTop:13},metric:{flex:1,backgroundColor:'#ECF5F1',padding:10,borderRadius:12,alignItems:'center'},metricNum:{fontWeight:'800',fontSize:18,color:teal},note:{fontSize:12,color:'#74857C',lineHeight:19,marginTop:10},sub:{fontSize:13,color:'#72867E',lineHeight:19},tile:{backgroundColor:'white',borderRadius:17,marginBottom:12,borderWidth:1,borderColor:'#E0EAE4',padding:17,flexDirection:'row',alignItems:'center',gap:13},tileIcon:{backgroundColor:'#E5F2EC',width:46,height:46,borderRadius:12,alignItems:'center',justifyContent:'center'},tileTitle:{color:dark,fontSize:18,fontWeight:'800',marginBottom:4},foodRow:{flexDirection:'row',alignItems:'center',paddingVertical:13,borderBottomWidth:1,borderBottomColor:'#E5ECE7'},foodName:{color:dark,fontWeight:'700',fontSize:15},input:{padding:13,borderWidth:1,borderColor:'#D6E4DD',borderRadius:11,backgroundColor:'#FFFFFF',fontSize:15,marginTop:10},label:{fontSize:15,color:dark,fontWeight:'800',marginTop:16,marginBottom:5},mealRow:{flexDirection:'row',flexWrap:'wrap',gap:7,marginVertical:9},chip:{paddingVertical:9,paddingHorizontal:12,borderRadius:20,backgroundColor:'#E8F0EA'},chipActive:{backgroundColor:teal},chipText:{color:dark,fontSize:12,fontWeight:'700'},chipTextActive:{color:'white'},button:{backgroundColor:teal,padding:15,borderRadius:12,alignItems:'center',marginTop:14},buttonText:{fontWeight:'800',color:'white',fontSize:16},recipeItem:{color:dark,fontSize:15,lineHeight:24,marginVertical:4},footer:{marginTop:25,color:'#82978F',fontSize:12,lineHeight:19}
});
