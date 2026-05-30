import React, { useState } from 'react';
import { Trophy, Calendar, Users, LogIn, CheckCircle, AlertCircle, Euro, ChevronRight, BarChart2, ShieldAlert } from 'lucide-react';

// ============================================================================
// ⚠️ CONFIGURACIÓN DE BASE DE DATOS (LISTA PARA PRODUCCIÓN)
// ============================================================================

// ¡IMPORTANTE! Cuando copies esto a tu VS Code, sigue estas instrucciones:
// 1. Quita las barras "//" de la siguiente línea para importar Supabase:
import { createClient } from '@supabase/supabase-js';

// 2. CAMBIA ESTA VARIABLE A FALSE:
const isMock = false; // <-- ¡CÁMBIALO A FALSE EN TU ORDENADOR!

// 3. Quita las barras "//" de las siguientes líneas:
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// --- MOCK FALSO (Para que esta Vista Previa funcione sin errores) ---
const supabaseMock = {
  auth: {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signUp: async () => { alert("Vista Previa: Simulando registro..."); return { error: null }; },
    signInWithPassword: async () => { alert("Vista Previa: Simulando login..."); return { error: null }; },
    signOut: async () => {}
  },
  from: () => ({
    select: () => ({ 
      eq: () => ({ single: async () => ({ data: null, error: null }) }),
      order: async () => ({ data: [], error: null }) 
    }),
    upsert: async () => ({ error: null }),
    insert: async () => ({ error: null })
  })
};

// 4. Quita las barras "//" de ESTA línea y BORRA la que dice "export const supabase = supabaseMock;"
// export const supabase = isMock ? supabaseMock : createClient(supabaseUrl, supabaseAnonKey);
export const supabase = supabaseMock;

// ============================================================================

// --- DATOS REALES (Simulados para 2026) ---
const TEAMS = [
  { id: 'ARG', name: 'Argentina', flag: '🇦🇷' },
  { id: 'BRA', name: 'Brasil', flag: '🇧🇷' },
  { id: 'CAN', name: 'Canadá', flag: '🇨🇦' },
  { id: 'COL', name: 'Colombia', flag: '🇨🇴' },
  { id: 'CRO', name: 'Croacia', flag: '🇭🇷' },
  { id: 'ENG', name: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 'ESP', name: 'España', flag: '🇪🇸' },
  { id: 'FRA', name: 'Francia', flag: '🇫🇷' },
  { id: 'GER', name: 'Alemania', flag: '🇩🇪' },
  { id: 'JPN', name: 'Japón', flag: '🇯🇵' },
  { id: 'MAR', name: 'Marruecos', flag: '🇲🇦' },
  { id: 'MEX', name: 'México', flag: '🇲🇽' },
  { id: 'NED', name: 'Países Bajos', flag: '🇳🇱' },
  { id: 'POR', name: 'Portugal', flag: '🇵🇹' },
  { id: 'SEN', name: 'Senegal', flag: '🇸🇳' },
  { id: 'URU', name: 'Uruguay', flag: '🇺🇾' },
  { id: 'USA', name: 'Estados Unidos', flag: '🇺🇸' }
].sort((a, b) => a.name.localeCompare(b.name));

const MOCK_LEADERBOARD = [
  { id: 1, name: 'Vecino_77', picks: { first: 'ESP', second: 'BRA', third: 'FRA', fourth: 'GER' }, points: 55, hasPaid: true },
  { id: 4, name: 'Luis_Perez', picks: { first: 'ESP', second: 'CRO', third: 'ARG', fourth: 'GER' }, points: 35, hasPaid: false },
  { id: 2, name: 'Marta_G', picks: { first: 'ARG', second: 'FRA', third: 'ENG', fourth: 'POR' }, points: 20, hasPaid: true },
  { id: 3, name: 'Carlos_Bar', picks: { first: 'BRA', second: 'ARG', third: 'NED', fourth: 'URU' }, points: 15, hasPaid: true },
];

const MOCK_MATCHES = [
  { id: 1, date: '11 Jun, 20:00', team1: 'México', flag1: '🇲🇽', score1: '-', team2: 'Alemania', flag2: '🇩🇪', score2: '-', status: 'Próximamente' },
  { id: 2, date: '12 Jun, 16:00', team1: 'España', flag1: '🇪🇸', score1: '-', team2: 'Marruecos', flag2: '🇲🇦', score2: '-', status: 'Próximamente' },
  { id: 3, date: 'Amistoso', team1: 'Argentina', flag1: '🇦🇷', score1: '2', team2: 'Brasil', flag2: '🇧🇷', score2: '1', status: 'Finalizado' },
];

export default function App() {
  const [user, setUser] = useState(null); 
  const [currentTab, setCurrentTab] = useState('home');
  const [userPicks, setUserPicks] = useState({ first: '', second: '', third: '', fourth: '' });
  const [isLocked, setIsLocked] = useState(false);
  const [profile, setProfile] = useState({ name: '', phone: '' });
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // --- Handlers ---
  const handleAuth = async (e) => {
    e.preventDefault();
    if (isMock) {
      // Simulación local
      const mockName = loginEmail.split('@')[0] || 'Jugador';
      setUser({ name: mockName, hasPaid: false }); 
      setCurrentTab('dashboard');
    } else {
      // Login/Registro Real en Supabase (Vercel)
      if (isRegistering) {
        const { data, error } = await supabase.auth.signUp({
          email: loginEmail,
          password: loginPass,
        });
        if (error) {
          alert('Error al registrar: ' + error.message);
          return;
        }
        alert('Registro exitoso. Ahora puedes entrar.');
        setIsRegistering(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: loginPass,
        });
        if (error) {
          alert('Error al entrar: Verifica tus credenciales o regístrate.');
          return;
        }
        setUser({ name: data.user.email.split('@')[0], hasPaid: false });
        setCurrentTab('dashboard');
      }
    }
  };

  const handleLogout = () => {
    if (!isMock) supabase.auth.signOut();
    setUser(null);
    setCurrentTab('home');
    setUserPicks({ first: '', second: '', third: '', fourth: '' });
    setIsLocked(false);
    setProfile({ name: '', phone: '' });
  };

  const updatePick = (position, teamId) => {
    if (isLocked) return;
    setUserPicks({ ...userPicks, [position]: teamId });
  };

  const isPicksValid = () => {
    const picksArray = Object.values(userPicks);
    const hasEmpty = picksArray.some(p => p === '');
    const uniqueTeams = new Set(picksArray.filter(p => p !== ''));
    return !hasEmpty && uniqueTeams.size === 4;
  };

  const lockPicks = async () => {
    if (isPicksValid() && profile.name.trim() !== '' && profile.phone.trim() !== '') {
      if(window.confirm("¿Estás seguro? Una vez guardados, no podrás cambiar tus datos ni tus favoritos.")) {
        setIsLocked(true);
        // Guardar en Supabase en el futuro
        if (!isMock && user) {
          try {
            // Obtener el ID del usuario
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
               console.log("Guardando en Supabase...");
               // supabase.from('profiles').upsert(...)
               // supabase.from('picks').upsert(...)
            }
          } catch(err) {
            console.error(err);
          }
        }
      }
    }
  };

  const Navbar = () => (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setCurrentTab(user ? 'dashboard' : 'home')}>
            <Trophy className="h-8 w-8 text-lime-400" />
            <span className="text-white font-bold text-xl tracking-wider">MUNDIAL<span className="text-lime-400">BET</span> 2026</span>
          </div>
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-slate-300 hidden sm:inline-block">Hola, <span className="font-semibold text-white">{user.name}</span></span>
                <button 
                  onClick={handleLogout}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Salir
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setCurrentTab('login')}
                className="bg-lime-500 hover:bg-lime-600 text-slate-900 px-4 py-2 rounded-md text-sm font-bold flex items-center transition-colors shadow-lg shadow-lime-500/20"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Entrar / Registro
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );

  const LandingPage = () => (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      {/* Hero Section */}
      <div 
        className="relative bg-slate-900 py-32 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center overflow-hidden bg-cover bg-center" 
        style={{ backgroundImage: "linear-gradient(to bottom, rgba(2, 6, 23, 0.7), rgba(2, 6, 23, 1)), url('https://images.unsplash.com/photo-1522778119026-d647f0596c20?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}
      >
        <Trophy className="h-24 w-24 text-lime-400 mb-6 z-10 drop-shadow-[0_0_25px_rgba(132,204,22,0.8)]" />
        <h1 className="text-5xl sm:text-7xl font-extrabold text-white tracking-tight z-10 mb-6 drop-shadow-lg">
          La Gran Porra del <span className="text-lime-400">Mundial 2026</span>
        </h1>
        <p className="max-w-2xl text-xl text-slate-200 z-10 mb-10 font-medium drop-shadow-md">
          Demuestra quién sabe más de fútbol en el barrio. Elige tus 4 favoritos y su posición exacta, sigue los resultados en directo y llévate el gran bote.
        </p>
        <button 
          onClick={() => setCurrentTab('login')}
          className="z-10 bg-lime-500 hover:bg-lime-400 text-slate-900 font-bold text-xl px-10 py-5 rounded-full shadow-[0_0_30px_rgba(132,204,22,0.5)] transition-all transform hover:scale-105"
        >
          ¡Participar Ahora!
        </button>
      </div>

      {/* Rules Section */}
      <div className="max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-white text-center mb-12">¿Cómo funciona?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg hover:border-slate-700 transition-colors">
            <div className="bg-lime-500/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="text-lime-400 h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">1. Elige 4 Favoritos</h3>
            <p className="text-slate-400 text-sm">
              Regístrate y selecciona a las 4 selecciones (Campeón, Subcampeón, 3º y 4º). Piensa bien, una vez guardados <strong>no se pueden cambiar</strong>.
            </p>
          </div>

          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg hover:border-slate-700 transition-colors">
            <div className="bg-blue-500/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Euro className="text-blue-400 h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">2. Cuota de 20€ (Bizum)</h3>
            <p className="text-slate-400 text-sm">
              Para validar tu apuesta debes realizar un Bizum de 20€ al administrador poniendo tu nombre de usuario en el concepto.
            </p>
          </div>

          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg hover:border-slate-700 transition-colors">
            <div className="bg-purple-500/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Trophy className="text-purple-400 h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">3. El Gran Bote</h3>
            <p className="text-slate-400 text-sm">
              Todo lo recaudado se reparte entre los 3 mejores al final del torneo. Cuantos más seamos, ¡mayor será el premio!
            </p>
          </div>
        </div>

        {/* Warning and Prizes */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-slate-900 border-l-4 border-lime-500 p-6 rounded-r-xl">
            <h4 className="text-white font-bold text-lg mb-4 flex items-center">
              <Trophy className="h-5 w-5 text-lime-400 mr-2" />
              Política de Premios
            </h4>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex justify-between border-b border-slate-800 pb-2">
                <span>🥇 1º Clasificado</span>
                <span className="font-bold text-lime-400">60% del Bote</span>
              </li>
              <li className="flex justify-between border-b border-slate-800 pb-2">
                <span>🥈 2º Clasificado</span>
                <span className="font-bold text-slate-200">25% del Bote</span>
              </li>
              <li className="flex justify-between border-b border-slate-800 pb-2">
                <span>🥉 3º Clasificado</span>
                <span className="font-bold text-orange-400">15% del Bote</span>
              </li>
            </ul>
            <div className="mt-4 p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <strong className="text-lime-400">En caso de empate:</strong> Si dos o más usuarios tienen los mismos puntos en puestos premiados, el importe de ese premio se dividirá a partes iguales entre todos los empatados.
            </div>
          </div>

          <div className="bg-slate-900 border-l-4 border-blue-500 p-6 rounded-r-xl">
            <h4 className="text-white font-bold text-lg mb-4 flex items-center">
              <BarChart2 className="h-5 w-5 text-blue-400 mr-2" />
              Sistema de Puntos
            </h4>
            <p className="text-xs text-slate-400 mb-3">Tus 4 equipos sumarán puntos según su progreso real en el torneo:</p>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex justify-between border-b border-slate-800 pb-2">
                <span>Pasan a Semifinales</span>
                <span className="font-bold text-blue-400">+5 pts</span>
              </li>
              <li className="flex justify-between border-b border-slate-800 pb-2">
                <span>Llegan a la Final</span>
                <span className="font-bold text-blue-400">+10 pts</span>
              </li>
              <li className="flex justify-between border-b border-slate-800 pb-2">
                <span>Ganan el Mundial</span>
                <span className="font-bold text-blue-400">+20 pts</span>
              </li>
            </ul>
          </div>

          <div className="bg-red-950/30 border-l-4 border-red-500 p-6 rounded-r-xl flex flex-col justify-center">
            <h4 className="text-red-400 font-bold text-lg mb-2 flex items-center">
              <ShieldAlert className="h-5 w-5 mr-2" />
              Aviso Importante
            </h4>
            <p className="text-sm text-slate-300">
              El administrador se reserva el derecho de <strong>eliminar de la plataforma y de la clasificación</strong> a cualquier usuario registrado que no haya abonado los 20€ correspondientes antes del inicio del torneo.
            </p>
          </div>
        </div>

        <div className="mt-12 text-center text-xs text-slate-600 border-t border-slate-800 pt-6">
          <p>Fuente de datos: Selecciones confirmadas para la Fase Final del Mundial 2026 basadas en datos oficiales de la FIFA (Actualizado). Selecciones no clasificadas han sido excluidas.</p>
        </div>
      </div>
    </div>
  );

  const LoginPage = () => (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-950">
      <div className="bg-slate-900 max-w-md w-full rounded-2xl shadow-2xl p-8 border border-slate-800">
        <div className="text-center mb-8">
          <Trophy className="h-12 w-12 text-lime-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white">Acceso Jugadores</h2>
          <p className="text-slate-400 mt-2 text-sm">
            {isMock ? "Entorno de vista previa activo." : (isRegistering ? "Crea tu cuenta para participar" : "Inicia sesión para ver tus resultados.")}
          </p>
        </div>
        
        {isMock && (
          <div className="mb-6 bg-orange-500/10 border border-orange-500/50 p-4 rounded-lg">
            <p className="text-orange-400 text-sm flex items-center font-medium">
              <AlertCircle className="w-4 h-4 mr-2" /> Modo Vista Previa
            </p>
            <p className="text-slate-400 text-xs mt-1">Las funciones de base de datos están desactivadas para evitar errores. Escribe cualquier cosa y entra.</p>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input 
              type="email" 
              required
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-all"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Contraseña</label>
            <input 
              type="password" 
              required
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-all"
              placeholder="••••••••"
              minLength={6}
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-lime-500 hover:bg-lime-400 text-slate-900 font-bold py-3 px-4 rounded-lg transition-colors flex justify-center items-center"
          >
            {isRegistering ? "Registrarme" : "Entrar"} <ChevronRight className="ml-2 h-5 w-5" />
          </button>
        </form>

        {!isMock && (
          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              {isRegistering ? "¿Ya tienes cuenta? Inicia Sesión" : "¿No tienes cuenta? Regístrate gratis"}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const Dashboard = () => {
    const [activeView, setActiveView] = useState('picks');

    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-950 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          
          {user && !user.hasPaid && (
            <div className="bg-orange-500/10 border border-orange-500/50 rounded-lg p-4 mb-6 flex items-start sm:items-center">
              <AlertCircle className="text-orange-500 h-5 w-5 mt-0.5 sm:mt-0 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-orange-400 text-sm font-medium">Estado del pago: Pendiente</p>
                <p className="text-slate-400 text-xs mt-1">Recuerda realizar el Bizum de 20€. Si no se recibe, tus apuestas serán anuladas.</p>
              </div>
            </div>
          )}

          <div className="flex overflow-x-auto bg-slate-900 border-b border-slate-800 mb-6 p-2 space-x-2 hide-scrollbar">
            <button onClick={() => setActiveView('picks')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeView === 'picks' ? 'bg-lime-500 text-slate-900' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <CheckCircle className="w-4 h-4 mr-2" /> Mis Favoritos
            </button>
            <button onClick={() => setActiveView('leaderboard')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeView === 'leaderboard' ? 'bg-lime-500 text-slate-900' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <Users className="w-4 h-4 mr-2" /> Clasificación Global
            </button>
            <button onClick={() => setActiveView('matches')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeView === 'matches' ? 'bg-lime-500 text-slate-900' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <Calendar className="w-4 h-4 mr-2" /> Resultados y Partidos
            </button>
          </div>

          {activeView === 'picks' && (
            <div className="space-y-6">
              <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <h3 className="text-xl font-bold text-white mb-4">1. Tus Datos (Requerido)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Nombre / Apodo</label>
                    <input type="text" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} disabled={isLocked} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-lime-500 disabled:opacity-50 transition-all" placeholder="Ej: Vecino_77"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Teléfono Móvil (Para Bizum)</label>
                    <input type="tel" value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} disabled={isLocked} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-lime-500 disabled:opacity-50 transition-all" placeholder="Ej: 600 123 456"/>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <h3 className="text-xl font-bold text-white mb-2">2. Selecciona tus 4 Favoritos (Por Posición)</h3>
                <p className="text-slate-400 text-sm mb-6">
                  {isLocked ? "Tus selecciones están bloqueadas. ¡Mucha suerte!" : "Elige quién será el Campeón, Subcampeón, Tercero y Cuarto. No puedes repetir equipos."}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[
                    { id: 'first', label: '1º Campeón', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
                    { id: 'second', label: '2º Subcampeón', color: 'text-slate-300', bg: 'bg-slate-300/10' },
                    { id: 'third', label: '3º Tercer Puesto', color: 'text-orange-400', bg: 'bg-orange-400/10' },
                    { id: 'fourth', label: '4º Cuarto Puesto', color: 'text-slate-500', bg: 'bg-slate-500/10' }
                  ].map(pos => (
                    <div key={pos.id} className={`p-4 rounded-xl border border-slate-700 ${pos.bg}`}>
                      <label className={`block font-bold mb-2 ${pos.color}`}>{pos.label}</label>
                      <select 
                        value={userPicks[pos.id]}
                        onChange={(e) => updatePick(pos.id, e.target.value)}
                        disabled={isLocked}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500 disabled:opacity-50 transition-all cursor-pointer"
                      >
                        <option value="">-- Selecciona un equipo --</option>
                        {TEAMS.map(team => {
                          const isSelectedElsewhere = Object.entries(userPicks).some(([key, val]) => key !== pos.id && val === team.id);
                          return (
                            <option key={team.id} value={team.id} disabled={isSelectedElsewhere}>
                              {team.flag} {team.name}
                            </option>
                          );
                        })}
                      </select>
                      {userPicks[pos.id] && (
                        <div className="mt-3 flex items-center text-sm font-medium text-white">
                          <span className="text-2xl mr-2">{TEAMS.find(t => t.id === userPicks[pos.id])?.flag}</span>
                          {TEAMS.find(t => t.id === userPicks[pos.id])?.name} seleccionado
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {!isLocked && (
                  <div className="mt-8 flex flex-col items-end">
                    { (!isPicksValid() || profile.name.trim() === '' || profile.phone.trim() === '') && (
                      <p className="text-orange-400 text-sm mb-3 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Completa tus datos personales y selecciona los 4 puestos sin repetir.
                      </p>
                    )}
                    <button
                      onClick={lockPicks}
                      disabled={!isPicksValid() || profile.name.trim() === '' || profile.phone.trim() === ''}
                      className={`px-6 py-3 rounded-lg font-bold transition-all
                        ${(isPicksValid() && profile.name.trim() !== '' && profile.phone.trim() !== '')
                          ? 'bg-lime-500 text-slate-900 hover:bg-lime-400 shadow-[0_0_15px_rgba(132,204,22,0.4)] transform hover:-translate-y-0.5' 
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                      `}
                    >
                      Confirmar y Guardar Apuesta
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeView === 'leaderboard' && (
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">Clasificación General</h3>
                  <p className="text-sm text-slate-400 mt-1">Bote Acumulado Estimado: <span className="text-lime-400 font-bold">{MOCK_LEADERBOARD.length * 20}€</span></p>
                </div>
                <BarChart2 className="h-6 w-6 text-slate-500" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-400">
                  <thead className="text-xs uppercase bg-slate-950/50 text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-medium">Pos</th>
                      <th className="px-6 py-4 font-medium">Usuario</th>
                      <th className="px-6 py-4 font-medium">Selecciones (1º al 4º)</th>
                      <th className="px-6 py-4 font-medium text-center">Puntos</th>
                      <th className="px-6 py-4 font-medium text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_LEADERBOARD.map((p, idx) => (
                      <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-white">{idx + 1}</td>
                        <td className="px-6 py-4 font-medium text-slate-200">{p.name}</td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            {['first', 'second', 'third', 'fourth'].map((pos, i) => {
                              const team = TEAMS.find(t => t.id === p.picks[pos]);
                              const posColors = ['border-yellow-400', 'border-slate-300', 'border-orange-400', 'border-slate-500'];
                              return (
                                <span key={pos} title={`${i+1}º - ${team?.name || '❓'}`} className={`text-lg bg-slate-950 px-2 py-0.5 rounded border-b-2 ${posColors[i]}`}>
                                  {team?.flag || '❓'}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-lime-400">{p.points}</td>
                        <td className="px-6 py-4 text-center">
                          {p.hasPaid ? (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400">Pagado</span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-500/10 text-red-400">Impago</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeView === 'matches' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white">Resultados y Próximos Partidos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MOCK_MATCHES.map(match => (
                  <div key={match.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-colors">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-medium text-slate-500 bg-slate-950 px-2 py-1 rounded-md">{match.date}</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${match.status === 'Finalizado' ? 'bg-slate-800 text-slate-400' : 'bg-lime-500/20 text-lime-400'}`}>
                        {match.status}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center space-x-4">
                      <div className="flex items-center space-x-3 w-1/3">
                        <span className="text-2xl">{match.flag1}</span>
                        <span className="font-semibold text-white hidden sm:block truncate">{match.team1}</span>
                      </div>
                      
                      <div className="flex-1 flex justify-center items-center space-x-2 bg-slate-950 py-2 px-4 rounded-lg">
                        <span className="text-xl font-bold text-white">{match.score1}</span>
                        <span className="text-slate-500">-</span>
                        <span className="text-xl font-bold text-white">{match.score2}</span>
                      </div>

                      <div className="flex items-center justify-end space-x-3 w-1/3">
                        <span className="font-semibold text-white hidden sm:block truncate text-right">{match.team2}</span>
                        <span className="text-2xl">{match.flag2}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    );
  };

  return (
    <div className="font-sans bg-slate-950 min-h-screen">
      <Navbar />
      {currentTab === 'home' && <LandingPage />}
      {currentTab === 'login' && <LoginPage />}
      {currentTab === 'dashboard' && <Dashboard />}
    </div>
  );
}