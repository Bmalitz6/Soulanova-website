    {section==='home'&&<View style={styles.card}>
      <Text style={styles.todayTitle}>Today's Activity</Text>
      <Text style={styles.todaySource}>{Platform.OS==='ios'?'Apple Health':'Health Connect'} · Daily totals</Text>
      <View style={styles.todayRow}>
        <View style={styles.todayMetric}><Text style={styles.todayLabel}>STEPS</Text><Text style={styles.todayNumber}>{todayHealth?.steps==null?'—':todayHealth.steps.toLocaleString()}</Text></View>
        <View style={styles.todayMetric}><Text style={styles.todayLabel}>DISTANCE</Text><Text style={styles.todayNumber}>{todayHealth?.miles==null?'—':todayHealth.miles.toFixed(2)+' mi'}</Text></View>
      </View>}
      <Text style={styles.notice}>{healthMessage}</Text>
      {action(healthBusy?'Refreshing…':'Refresh Today’s Activity',()=>{void connectHealth();},healthBusy)}
      <Text style={styles.notice}>Daily totals are separate from your guided and Freestyle workouts.</Text>
    </View>
    {section==='home'&&<>
      <TouchableOpacity accessibilityRole="button" onPress={()=>setShowFree(true)} disabled={running} style={styles.navTile}>
        <Text style={styles.navTitle}>🚶 Walk / Run Freestyle  →</Text>
        <Text style={styles.navSubtitle}>Your pace, music, GPS and workout tracking</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={()=>setSection('guided')} style={styles.navTile}>
        <Text style={styles.navTitle}>🎧 Guided SoulWalk  →</Text>
        <Text style={styles.navSubtitle}>12-week coached walking program · Week {week+1}</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={()=>setSection('safety')} style={styles.navTile}>
        <Text style={styles.navTitle}>🛡️ SoulSafe  →</Text>
        <Text style={styles.navSubtitle}>Share your location or manage live sharing</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={()=>setSection('history')} style={styles.navTile}>
        <Text style={styles.navTitle}>📊 Walking History  →</Text>
        <Text style={styles.navSubtitle}>Your completed activities and progress</Text>
      </TouchableOpacity>
      {running&&<Text style={styles.notice}>Your guided walk is still in progress. Open Guided SoulWalk to control it.</Text>}
    </>}
    {section!=='home'&&<TouchableOpacity accessibilityRole="button" onPress={()=>setSection('home')} style={styles.sectionBack}><Text style={styles.back}>‹ SoulWalk Home</Text></TouchableOpacity>}
    {section==='safety'&&<SoulSafe />}
    {section==='guided'&&<>
    <View style={styles.card}>
      <Text style={styles.eyebrow}>WEEK {week+1} · {Math.round(duration/60)} MINUTES</Text>
      <Text style={styles.phase}>{phase}</Text>
      <Text style={styles.clock}>{clock(Math.max(0,duration-elapsed))}</Text>
      <View style={styles.track}><View style={[styles.fill,{width:(elapsed/duration*100)+'%'}]}/></View>
      <Text style={styles.note}>5 min warm-up · {brisk[week]} min brisk · 5 min cool-down</Text>
      <View style={styles.actions}>{action(complete?'Finished':running?'Walking':'Start / Resume',start,running||complete)}{action('Pause',pause,!running)}{action('Reset',()=>Alert.alert('Reset walk?','This discards the current unsaved timer.',[{text:'Cancel',style:'cancel'},{text:'Reset',style:'destructive',onPress:reset}]))}</View>
      <View style={styles.statRow}><Text style={styles.stat}>Serene coaching voice</Text><Switch value={coaching} onValueChange={setCoaching} trackColor={{true:teal}} accessibilityLabel="Serene coaching voice"/></View>
      {complete&&<View style={styles.saveSection}>
        <Text style={styles.stat}>Workout Health Data</Text>
        <Text style={styles.notice}>Read steps and distance recorded between this walk's start and finish. Pauses may be included. Results depend on your watch syncing.</Text>
        {action(workoutBusy?'Reading Activity…':workoutHealth?'Refresh Workout Activity':'Read Workout Activity',()=>{void readWorkoutHealth();},workoutBusy||saving||saved)}
        {workoutHealth&&<Text style={styles.stat}>Workout: {workoutHealth.steps===null?'—':workoutHealth.steps.toLocaleString()} steps · {workoutHealth.miles===null?'—':workoutHealth.miles.toFixed(2)} miles</Text>}
        {!!workoutMessage&&<Text style={styles.notice}>{workoutMessage}</Text>}
        <Text style={styles.stat}>Steps from your watch or phone (optional)</Text>
        <TextInput accessibilityLabel="Steps during this walk" keyboardType="number-pad"
          placeholder={workoutHealth?.steps===null||!workoutHealth?'Enter steps':`Health: ${workoutHealth.steps} steps (or override)`} value={stepsText} onChangeText={setStepsText}
          editable={!saved&&!saving} style={styles.stepInput}/>
        {action(saved?'Walk Saved':saving?'Saving…':'Save Completed Walk',
          ()=>{void saveWalk();},saved||saving)}
        {!!saveMessage&&<Text accessibilityRole="alert" style={styles.notice}>{saveMessage}</Text>}
      </View>}
      <Text style={styles.notice}>Apple Health workout reading is available when a walk finishes. GPS and background workout tracking are not enabled. Keep the app in the foreground during testing.</Text>
    </View>
    <Text style={styles.heading}>Choose your week</Text>
    <View style={styles.weeks}>{brisk.map((n,i)=><TouchableOpacity key={i} onPress={()=>choose(i)} disabled={running} style={[styles.week,i===week&&styles.selected]}><Text style={styles.weekText}>Week {i+1}</Text><Text style={styles.min}>{n+10} min</Text></TouchableOpacity>)}</View>
    </>}
    {section==='history'&&<>
    <View style={styles.card}>
      <Text style={styles.heading}>Your Walking History</Text>
      <View style={styles.statRow}>
       <Text style={styles.stat}>Walks: {walks.length.toLocaleString()}</Text>
       <Text style={styles.stat}>Steps: {walks.reduce((sum,w)=>sum+(w.steps??0),0).toLocaleString()}</Text>
      </View>
      <View style={styles.statRow}>
       <Text style={styles.stat}>Miles: {walks.reduce((sum,w)=>sum+(w.distance_miles??0),0).toFixed(2)}</Text>
       <Text style={styles.stat}>Weeks: {new Set(walks.map(w=>w.week_number)).size}/12</Text>
      </View>
      <Text style={styles.notice}>{historyMessage}</Text>
      {walks.slice(0,10).map(w=><Text key={w.id} style={styles.historyItem}>{new Date(w.created_at).toLocaleDateString()} · Week {w.week_number} · {Number(w.duration_minutes).toFixed(1)} min · {w.steps??'—'} steps</Text>)}
      {action(historyBusy?'Refreshing…':'Refresh History',()=>{void refreshHistory();},historyBusy)}
    </View>
    </>}
  </ScrollView>;
}
const styles=StyleSheet.create({navTile:{backgroundColor:'#FFFFFF',borderRadius:18,borderWidth:1,borderColor:'#DCE8E2',padding:20,marginTop:13},navTitle:{fontSize:19,fontWeight:'800',color:'#173238'},navSubtitle:{fontSize:13,color:'#6A8079',marginTop:8},sectionBack:{marginTop:12,marginBottom:4},todayTitle:{fontSize:22,fontWeight:'800',color:'#173238'},todaySource:{fontSize:12,color:'#6A8079',marginTop:4},todayRow:{flexDirection:'row',gap:10,marginTop:15},todayMetric:{flex:1,backgroundColor:'#EAF4F0',borderRadius:12,padding:14},todayLabel:{fontSize:11,fontWeight:'800',color:'#617C72'},todayNumber:{fontSize:24,fontWeight:'800',color:'#086B63',marginTop:4},
 page:{flex:1,backgroundColor:'#F7F8F5'},container:{padding:22,paddingTop:Platform.OS==='android' ? (StatusBar.currentHeight ?? 24)+20 : 76,paddingBottom:45},
 back:{color:teal,fontSize:16,fontWeight:'700',marginBottom:16},title:{color:dark,fontSize:32,fontWeight:'800'},subtitle:{color:'#6A8079',fontSize:16,marginTop:5,marginBottom:16},
 card:{backgroundColor:'white',borderRadius:22,padding:17,borderWidth:1,borderColor:'#DCE8E2'},
 eyebrow:{color:teal,fontSize:12,fontWeight:'800',letterSpacing:1.5},phase:{color:dark,textAlign:'center',fontSize:22,fontWeight:'700',marginTop:15},
 clock:{color:teal,fontSize:56,textAlign:'center',fontWeight:'800',fontVariant:['tabular-nums'],marginVertical:7},
 track:{height:12,backgroundColor:'#DCE8E2',borderRadius:8,overflow:'hidden'},fill:{height:'100%',backgroundColor:teal},note:{textAlign:'center',color:'#657F78',marginTop:14},
 actions:{gap:10,marginTop:14},button:{backgroundColor:teal,borderRadius:12,padding:14,alignItems:'center'},disabled:{opacity:.4},buttonText:{color:'white',fontSize:16,fontWeight:'800'},
 notice:{fontSize:12,color:'#71817B',lineHeight:18,marginTop:15},heading:{color:dark,fontSize:23,fontWeight:'800',marginTop:28,marginBottom:12},
 saveSection:{marginTop:20},stepInput:{backgroundColor:'#F8FAF8',padding:14,borderRadius:12,borderWidth:1,borderColor:'#D9E7E1',marginTop:10,marginBottom:12,fontSize:17},
 statRow:{flexDirection:'row',justifyContent:'space-between',marginTop:12,gap:10},stat:{color:dark,fontSize:16,fontWeight:'700'},historyItem:{color:'#536E67',paddingVertical:8,borderBottomWidth:1,borderBottomColor:'#E4EDE8'},
 weeks:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between'},week:{width:'31%',padding:12,borderRadius:12,backgroundColor:'white',borderWidth:1,borderColor:'#DEE8E2',marginBottom:10},selected:{borderColor:teal,borderWidth:2},weekText:{fontWeight:'800',color:dark},min:{color:'#708780',marginTop:4}
});    {section==='home'&&<>
    <View style={styles.card}>
      <Text style={styles.todayTitle}>Today's Activity</Text>
      <Text style={styles.todaySource}>{Platform.OS==='ios'?'Apple Health':'Health Connect'} · Daily totals</Text>
      <View style={styles.todayRow}>
        <View style={styles.todayMetric}><Text style={styles.todayLabel}>STEPS</Text><Text style={styles.todayNumber}>{todayHealth?.steps==null?'—':todayHealth.steps.toLocaleString()}</Text></View>
        <View style={styles.todayMetric}><Text style={styles.todayLabel}>DISTANCE</Text><Text style={styles.todayNumber}>{todayHealth?.miles==null?'—':todayHealth.miles.toFixed(2)+' mi'}</Text></View>
      </View>
      <Text style={styles.notice}>{healthMessage}</Text>
      {action(healthBusy?'Refreshing…':'Refresh Today’s Activity',()=>{void connectHealth();},healthBusy)}
      <Text style={styles.notice}>Daily totals are separate from your guided and Freestyle workouts.</Text>
    </View>
    </>}
    {section==='home'&&<>
      <TouchableOpacity accessibilityRole="button" onPress={()=>setShowFree(true)} disabled={running} style={styles.navTile}>
        <Text style={styles.navTitle}>🚶 Walk / Run Freestyle  →</Text>
        <Text style={styles.navSubtitle}>Your pace, music, GPS and workout tracking</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={()=>setSection('guided')} style={styles.navTile}>
        <Text style={styles.navTitle}>🎧 Guided SoulWalk  →</Text>
        <Text style={styles.navSubtitle}>12-week coached walking program · Week {week+1}</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={()=>setSection('safety')} style={styles.navTile}>
        <Text style={styles.navTitle}>🛡️ SoulSafe  →</Text>
        <Text style={styles.navSubtitle}>Share your location or manage live sharing</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={()=>setSection('history')} style={styles.navTile}>
        <Text style={styles.navTitle}>📊 Walking History  →</Text>
        <Text style={styles.navSubtitle}>Your completed activities and progress</Text>
      </TouchableOpacity>
      {running&&<Text style={styles.notice}>Your guided walk is still in progress. Open Guided SoulWalk to control it.</Text>}
    </>}
    {section!=='home'&&<TouchableOpacity accessibilityRole="button" onPress={()=>setSection('home')} style={styles.sectionBack}><Text style={styles.back}>‹ SoulWalk Home</Text></TouchableOpacity>}
    {section==='safety'&&<SoulSafe />}
    {section==='guided'&&<>
    <View style={styles.card}>
      <Text style={styles.eyebrow}>WEEK {week+1} · {Math.round(duration/60)} MINUTES</Text>
      <Text style={styles.phase}>{phase}</Text>
      <Text style={styles.clock}>{clock(Math.max(0,duration-elapsed))}</Text>
      <View style={styles.track}><View style={[styles.fill,{width:(elapsed/duration*100)+'%'}]}/></View>
      <Text style={styles.note}>5 min warm-up · {brisk[week]} min brisk · 5 min cool-down</Text>
      <View style={styles.actions}>{action(complete?'Finished':running?'Walking':'Start / Resume',start,running||complete)}{action('Pause',pause,!running)}{action('Reset',()=>Alert.alert('Reset walk?','This discards the current unsaved timer.',[{text:'Cancel',style:'cancel'},{text:'Reset',style:'destructive',onPress:reset}]))}</View>
      <View style={styles.statRow}><Text style={styles.stat}>Serene coaching voice</Text><Switch value={coaching} onValueChange={setCoaching} trackColor={{true:teal}} accessibilityLabel="Serene coaching voice"/></View>
      {complete&&<View style={styles.saveSection}>
        <Text style={styles.stat}>Workout Health Data</Text>
        <Text style={styles.notice}>Read steps and distance recorded between this walk's start and finish. Pauses may be included. Results depend on your watch syncing.</Text>
        {action(workoutBusy?'Reading Activity…':workoutHealth?'Refresh Workout Activity':'Read Workout Activity',()=>{void readWorkoutHealth();},workoutBusy||saving||saved)}
        {workoutHealth&&<Text style={styles.stat}>Workout: {workoutHealth.steps===null?'—':workoutHealth.steps.toLocaleString()} steps · {workoutHealth.miles===null?'—':workoutHealth.miles.toFixed(2)} miles</Text>}
        {!!workoutMessage&&<Text style={styles.notice}>{workoutMessage}</Text>}
        <Text style={styles.stat}>Steps from your watch or phone (optional)</Text>
        <TextInput accessibilityLabel="Steps during this walk" keyboardType="number-pad"
          placeholder={workoutHealth?.steps===null||!workoutHealth?'Enter steps':`Health: ${workoutHealth.steps} steps (or override)`} value={stepsText} onChangeText={setStepsText}
          editable={!saved&&!saving} style={styles.stepInput}/>
        {action(saved?'Walk Saved':saving?'Saving…':'Save Completed Walk',
          ()=>{void saveWalk();},saved||saving)}
        {!!saveMessage&&<Text accessibilityRole="alert" style={styles.notice}>{saveMessage}</Text>}
      </View>}
      <Text style={styles.notice}>Apple Health workout reading is available when a walk finishes. GPS and background workout tracking are not enabled. Keep the app in the foreground during testing.</Text>
    </View>
    <Text style={styles.heading}>Choose your week</Text>
    <View style={styles.weeks}>{brisk.map((n,i)=><TouchableOpacity key={i} onPress={()=>choose(i)} disabled={running} style={[styles.week,i===week&&styles.selected]}><Text style={styles.weekText}>Week {i+1}</Text><Text style={styles.min}>{n+10} min</Text></TouchableOpacity>)}</View>
    </>}
    {section==='history'&&<>
    <View style={styles.card}>
      <Text style={styles.heading}>Your Walking History</Text>
      <View style={styles.statRow}>
       <Text style={styles.stat}>Walks: {walks.length.toLocaleString()}</Text>
       <Text style={styles.stat}>Steps: {walks.reduce((sum,w)=>sum+(w.steps??0),0).toLocaleString()}</Text>
      </View>
      <View style={styles.statRow}>
       <Text style={styles.stat}>Miles: {walks.reduce((sum,w)=>sum+(w.distance_miles??0),0).toFixed(2)}</Text>
       <Text style={styles.stat}>Weeks: {new Set(walks.map(w=>w.week_number)).size}/12</Text>
      </View>
      <Text style={styles.notice}>{historyMessage}</Text>
      {walks.slice(0,10).map(w=><Text key={w.id} style={styles.historyItem}>{new Date(w.created_at).toLocaleDateString()} · Week {w.week_number} · {Number(w.duration_minutes).toFixed(1)} min · {w.steps??'—'} steps</Text>)}
      {action(historyBusy?'Refreshing…':'Refresh History',()=>{void refreshHistory();},historyBusy)}
    </View>
    </>}
  </ScrollView>;
}
const styles=StyleSheet.create({todayTitle:{fontSize:22,fontWeight:'800',color:'#173238'},todaySource:{fontSize:12,color:'#6A8079',marginTop:4},todayRow:{flexDirection:'row',gap:10,marginTop:15},todayMetric:{flex:1,backgroundColor:'#EAF4F0',borderRadius:12,padding:14},todayLabel:{fontSize:11,fontWeight:'800',color:'#617C72'},todayNumber:{fontSize:24,fontWeight:'800',color:'#086B63',marginTop:4},
 page:{flex:1,backgroundColor:'#F7F8F5'},container:{padding:22,paddingTop:Platform.OS==='android' ? (StatusBar.currentHeight ?? 24)+20 : 76,paddingBottom:45},
 back:{color:teal,fontSize:16,fontWeight:'700',marginBottom:16},title:{color:dark,fontSize:32,fontWeight:'800'},subtitle:{color:'#6A8079',fontSize:16,marginTop:5,marginBottom:16},
 card:{backgroundColor:'white',borderRadius:22,padding:17,borderWidth:1,borderColor:'#DCE8E2'},
 eyebrow:{color:teal,fontSize:12,fontWeight:'800',letterSpacing:1.5},phase:{color:dark,textAlign:'center',fontSize:22,fontWeight:'700',marginTop:15},
 clock:{color:teal,fontSize:56,textAlign:'center',fontWeight:'800',fontVariant:['tabular-nums'],marginVertical:7},
 track:{height:12,backgroundColor:'#DCE8E2',borderRadius:8,overflow:'hidden'},fill:{height:'100%',backgroundColor:teal},note:{textAlign:'center',color:'#657F78',marginTop:14},
 actions:{gap:10,marginTop:14},button:{backgroundColor:teal,borderRadius:12,padding:14,alignItems:'center'},disabled:{opacity:.4},buttonText:{color:'white',fontSize:16,fontWeight:'800'},
 notice:{fontSize:12,color:'#71817B',lineHeight:18,marginTop:15},heading:{color:dark,fontSize:23,fontWeight:'800',marginTop:28,marginBottom:12},
 saveSection:{marginTop:20},stepInput:{backgroundColor:'#F8FAF8',padding:14,borderRadius:12,borderWidth:1,borderColor:'#D9E7E1',marginTop:10,marginBottom:12,fontSize:17},
 statRow:{flexDirection:'row',justifyContent:'space-between',marginTop:12,gap:10},stat:{color:dark,fontSize:16,fontWeight:'700'},historyItem:{color:'#536E67',paddingVertical:8,borderBottomWidth:1,borderBottomColor:'#E4EDE8'},
 weeks:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between'},week:{width:'31%',padding:12,borderRadius:12,backgroundColor:'white',borderWidth:1,borderColor:'#DEE8E2',marginBottom:10},selected:{borderColor:teal,borderWidth:2},weekText:{fontWeight:'800',color:dark},min:{color:'#708780',marginTop:4}
});
