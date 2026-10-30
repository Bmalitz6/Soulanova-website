import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import MemberScreen from './MemberScreen';
import SoulWalkScreen from './SoulWalkScreen';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ImageBackground, StatusBar,
  SafeAreaView, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const TEAL = '#086B63';
const DARK = '#173238';
const BG = '#F7F8F5';

const images = {
  hero: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1100&q=85',
  walk: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=900&q=85',
  tai: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=900&q=85',
  meditation: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=900&q=85',
  strength: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&q=85',
};

const programs = [
  { title: 'SoulWalk', subtitle: 'Find your pace. Enjoy the journey.',
    image: images.walk, tag: 'WALKING & CARDIO' },
  { title: 'Tai Chi', subtitle: 'Balance your body and mind.',
    image: images.tai, tag: 'MINDFUL MOVEMENT' },
  { title: 'Meditation', subtitle: 'Make space for calm.',
    image: images.meditation, tag: 'MINDFULNESS' },
  { title: 'Strength & Fitness', subtitle: 'Grow stronger every day.',
    image: images.strength, tag: 'STRENGTH & MOBILITY' },
];

function ProgramCard({ item, onSoulWalk }: { item: typeof programs[number], onSoulWalk: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => item.title === 'SoulWalk' ? onSoulWalk() : Alert.alert(item.title,
        'We are connecting this section to the existing Soulanova library.')}
      style={styles.programCard}
    >
      <ImageBackground
        source={{ uri: item.image }}
        style={styles.programImage}
        imageStyle={{ borderRadius: 20 }}
      >
        <LinearGradient
          colors={['transparent', 'rgba(5,30,30,0.88)']}
          style={styles.programGradient}
        >
          <Text style={styles.programTag}>{item.tag}</Text>
          <View style={styles.programRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.programTitle}>{item.title}</Text>
              <Text style={styles.programSubtitle}>{item.subtitle}</Text>
            </View>
            <View style={styles.arrowCircle}>
              <Ionicons name="arrow-forward" size={19} color={TEAL} />
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
}

export default function App() {
  const [screen, setScreen] = useState<'home' | 'walk' | 'account'>('home');
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({data}) => setSession(data.session));
    const {data: listener} = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, []);
  if (screen === 'account') return <MemberScreen onBack={() => setScreen('home')} emailSignedIn={session?.user.email ?? null} />;
  if (screen === 'walk') return <SoulWalkScreen onBack={() => setScreen('home')} />;
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.brand}>✺ SOULANOVA</Text>
            <Text style={styles.tagline}>MOVE  •  BREATHE  •  THRIVE</Text>
          </View>
          <TouchableOpacity
            style={styles.profile}
            onPress={() => setScreen('account')}
          >
            <Ionicons name="person-outline" size={23} color={TEAL} />
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <ImageBackground
            source={{ uri: images.hero }}
            style={styles.heroImage}
            imageStyle={{ borderRadius: 24 }}
          >
            <LinearGradient
              colors={['rgba(0,30,30,0.08)', 'rgba(0,48,45,0.90)']}
              style={styles.heroGradient}
            >
              <View style={styles.heroContent}>
                <Text style={styles.eyebrow}>YOUR WELLNESS JOURNEY</Text>
                <Text style={styles.heroTitle}>
                  Feel better.{'\n'}Live brighter.
                </Text>
                <Text style={styles.heroText}>
                  Every step toward wellness matters.
                </Text>
                <TouchableOpacity
                  style={styles.heroButton}
                  onPress={() => setScreen('walk')}
                >
                  <Text style={styles.heroButtonText}>
                    Start Your Journey
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color={TEAL} />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Explore & Thrive</Text>
          <Text style={styles.sectionSub}>
            Find your movement. Discover your calm.
          </Text>
        </View>

        {programs.map(item => (
          <ProgramCard key={item.title} item={item} onSoulWalk={() => setScreen('walk')} />
        ))}

        <TouchableOpacity
          style={styles.progressCard}
          onPress={() => Alert.alert('Your Progress',
            'We are connecting your Supabase workout history.')}
        >
          <View style={styles.progressIcon}>
            <Ionicons name="stats-chart-outline" size={25} color={TEAL} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.progressTitle}>Your Wellness Progress</Text>
            <Text style={styles.progressSub}>
              Your journey, milestones and achievements
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={TEAL} />
        </TouchableOpacity>

        <Text style={styles.footer}>
          SOULANOVA WELLNESS{'\n'}
          Move with purpose. Live with balance.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  container: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 45 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 25
  },
  brand: {
    color: TEAL, fontSize: 24, fontWeight: '800', letterSpacing: 2
  },
  tagline: {
    color: '#768C85', fontSize: 10, letterSpacing: 2, marginTop: 5
  },
  profile: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#E5F1EC', alignItems: 'center',
    justifyContent: 'center'
  },
  hero: { marginBottom: 30, borderRadius: 24, overflow: 'hidden',
    backgroundColor: TEAL },
  heroImage: { height: 350 },
  heroGradient: { flex: 1, justifyContent: 'flex-end' },
  heroContent: { padding: 24 },
  eyebrow: {
    color: '#D4ECE6', fontSize: 11, fontWeight: '700',
    letterSpacing: 2, marginBottom: 12
  },
  heroTitle: {
    color: '#FFFFFF', fontSize: 37, lineHeight: 44,
    fontWeight: '800', marginBottom: 10
  },
  heroText: {
    color: '#E3EEEA', fontSize: 15, marginBottom: 23
  },
  heroButton: {
    backgroundColor: '#FFFFFF', borderRadius: 13,
    paddingHorizontal: 18, paddingVertical: 15,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between'
  },
  heroButtonText: { color: TEAL, fontWeight: '800', fontSize: 16 },
  sectionHeading: { marginBottom: 18 },
  sectionTitle: { color: DARK, fontSize: 25, fontWeight: '800' },
  sectionSub: { color: '#788B85', fontSize: 14, marginTop: 5 },
  programCard: {
    height: 196, borderRadius: 20, overflow: 'hidden',
    marginBottom: 16, backgroundColor: TEAL
  },
  programImage: { flex: 1 },
  programGradient: {
    flex: 1, justifyContent: 'flex-end', padding: 20
  },
  programTag: {
    color: '#C4EAE2', fontSize: 10,
    letterSpacing: 1.7, fontWeight: '700', marginBottom: 7
  },
  programRow: {
    flexDirection: 'row', alignItems: 'center'
  },
  programTitle: {
    color: '#FFFFFF', fontSize: 27, fontWeight: '800'
  },
  programSubtitle: {
    color: '#E1EBE8', fontSize: 13, marginTop: 5
  },
  arrowCircle: {
    width: 37, height: 37, borderRadius: 19,
    backgroundColor: '#FFFFFF', alignItems: 'center',
    justifyContent: 'center', marginLeft: 12
  },
  progressCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: 17, backgroundColor: '#E6F2EE',
    borderRadius: 18, marginTop: 8
  },
  progressIcon: {
    width: 47, height: 47, borderRadius: 14,
    backgroundColor: '#D4E8E1', justifyContent: 'center',
    alignItems: 'center', marginRight: 13
  },
  progressTitle: {
    color: DARK, fontSize: 16, fontWeight: '800'
  },
  progressSub: {
    color: '#68827A', fontSize: 12, marginTop: 5,
    lineHeight: 17
  },
  footer: {
    color: '#91A39D', textAlign: 'center',
    marginTop: 33, fontSize: 11,
    letterSpacing: 0.7, lineHeight: 20
  }
});
