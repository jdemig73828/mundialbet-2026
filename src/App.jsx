import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Calendar, 
  Users, 
  LogIn, 
  CheckCircle, 
  AlertCircle, 
  Euro, 
  ChevronRight, 
  BarChart2, 
  ShieldAlert, 
  Loader2,
  X,
  User,
  Info
} from 'lucide-react';

// Listado de selecciones reales confirmadas para el Mundial 2026 (Excluida Italia)
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

// Función segura para obtener variables de entorno
const getEnvVariable = (key) => {
  try {
    return new Function('return import.meta.env')()[key];
  } catch (e) {
    return undefined;
  }
};

const supabaseUrl = getEnvVariable('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVariable('VITE_SUPABASE_ANON_KEY');
const hasRealCredentials = !!(supabaseUrl && supabaseAnonKey);

let supabaseClientInstance = null;

const getSupabaseClient = async () => {
  if (supabaseClientInstance) return supabaseClientInstance;
  if (!hasRealCredentials) return null;

  try {
    if (window.supabase) {
      supabaseClientInstance = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
      return supabaseClientInstance;
    }
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.async = true;
      script.onload = () => {
        if (window.supabase) {
          supabaseClientInstance = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
          resolve(supabaseClientInstance);
        } else {
          resolve(null);
        }
      };
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    });
  } catch (error) {
    console.error("Error al inicializar cliente Supabase dinámicamente:", error);
    return null;
  }
};

// ⚠️ SISTEMA FORZADO DE PURGA DE DATOS FALSOS
const getLocalDb = () => {
  const defaultDb = {
    profiles: [], 
    picks: [],    
    matches: [
      { id: 1, phase: 'Fase de Grupos - Jornada 1', date: '11-16 Jun 2026', team1: 'Por definir', flag1: '❓', score1: '-', team2: 'Por definir', flag2: '❓', score2: '-', status: 'Próximamente' },
      { id: 2, phase: 'Fase de Grupos - Jornada 2', date: '17-21 Jun 2026', team1: 'Por definir', flag1: '❓', score1: '-', team2: 'Por definir', flag2: '❓', score2: '-', status: 'Próximamente' },
      { id: 3, phase: 'Fase de Grupos - Jornada 3', date: '22-27 Jun 2026', team1: 'Por definir', flag1: '❓', score1: '-', team2: 'Por definir', flag2: '❓', score2: '-', status: 'Próximamente' },
      { id: 73, phase: 'Dieciseisavos de Final', date: '28-03 Jul 2026', team1: '1º Grupo A', flag1: '❓', score1: '-', team2: '3º Grupo C/D/E', flag2: '❓', score2: '-', status: 'Por definir' },
      { id: 89, phase: 'Octavos de Final', date: '04-07 Jul 2026', team1: 'Ganador D1', flag1: '❓', score1: '-', team2: 'Ganador D2', flag2: '❓', score2: '-', status: 'Por definir' },
      { id: 97, phase: 'Cuartos de Final', date: '09-11 Jul 2026', team1: 'Ganador O1', flag1: '❓', score1: '-', team2: 'Ganador O2', flag2: '❓', score2: '-', status: 'Por definir' },
      { id: 101, phase: 'Semifinales', date: '14-15 Jul 2026', team1: 'Ganador C1', flag1: '❓', score1: '-', team2: 'Ganador C2', flag2: '❓', score2: '-', status: 'Por definir' },
      { id: 103, phase: '3º y 4º Puesto', date: '18 Jul 2026', team1: 'Perdedor S1', flag1: '❓', score1: '-', team2: 'Perdedor S2', flag2: '❓', score2: '-', status: 'Por definir' },
      { id: 104, phase: '🏆 Gran Final', date: '19 Jul 2026', team1: 'Ganador S1', flag1: '❓', score1: '-', team2: 'Ganador S2', flag2: '❓', score2: '-', status: 'Por definir' }
    ]
  };

  const stored = localStorage.getItem('mundialbet_local_db');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // 🔥 ESTO BORRA EL ERROR: Si detecta que tienes el amistoso Argentina-Brasil (id: 3), MACHACA y sobreescribe tu memoria con el cuadro real
      const hasFakeMatch = parsed.matches && parsed.matches.some(m => m.team1 === 'Argentina' && m.score1 === '2');
      if (hasFakeMatch) {
         console.warn("Purgando partidos antiguos de la memoria caché...");
         localStorage.setItem('mundialbet_local_db', JSON.stringify(defaultDb));
         return defaultDb;
      }
      return parsed;
    } catch (e) {
      return defaultDb;
    }
  }
  localStorage.setItem('mundialbet_local_db', JSON.stringify(defaultDb));
  return defaultDb;
};

const saveLocalDb = (db) => {
  localStorage.setItem('mundialbet_local_db', JSON.stringify(db));
};

const ToastNotification = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.show, onClose]);

  if (!toast.show) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-bounce max-w-sm w-full bg-slate-900 border-l-4 border-lime-500 rounded-lg shadow-2xl p-4 flex items-start space-x-3 transition-all duration-300">
      <div className="flex-shrink-0 mt-0.5">
        {toast.type === 'success' ? (
          <CheckCircle className="h-5 w-5 text-lime-400" />
        ) : (
          <AlertCircle className="h-5 w-5 text-red-400" />
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">Notificación</p>
        <p className="text-xs text-slate-300 mt-1">{toast.message}</p>
      </div>
      <button onClick={onClose} className="text-slate-500 hover:text-white">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

const ConfirmationModal = ({ modal, onClose, onConfirm }) => {
  if (!modal.show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scale-up">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-lime-500/10 p-2 rounded-full">
            <Info className="h-6 w-6 text-lime-400" />
          </div>
          <h3 className="text-lg font-bold text-white">{modal.title}</h3>
        </div>
        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
          {modal.message}
        </p>
        <div className="flex items-center justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-lg text-sm font-semibold transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-lime-500 hover:bg-lime-400 text-slate-900 rounded-lg text-sm font-bold transition-all cursor-pointer shadow-lg shadow-lime-500/10"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

const Navbar = ({ user, setCurrentTab, handleLogout }) => (
  <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-md">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        <div 
          className="flex items-center space-x-2 cursor-pointer select-none" 
          onClick={() => setCurrentTab(user ? 'dashboard' : 'home')}
        >
          <Trophy className="h-8 w-8 text-lime-400 drop-shadow-[0_0_10px_rgba(132,204,22,0.4)]" />
          <span className="text-white font-black text-xl tracking-wider">
            MUNDIAL<span className="text-lime-400">BET</span> 2026
          </span>
        </div>
        <div className="flex items-center">
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-slate-300 hidden sm:inline-block text-sm">
                Hola, <span className="font-bold text-white">{user.name}</span>
              </span>
              <button 
                onClick={handleLogout}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer border border-slate-700"
              >
                Salir
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setCurrentTab('login')}
              className="bg-lime-500 hover:bg-lime-600 text-slate-900 px-4 py-2 rounded-lg text-sm font-bold flex items-center transition-all shadow-lg shadow-lime-500/20 cursor-pointer"
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

const LandingPage = ({ setCurrentTab }) => (
  <div className="min-h-screen bg-slate-950 text-slate-300">
    <div 
      className="relative bg-slate-900 py-24 sm:py-32 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center overflow-hidden bg-cover bg-center" 
      style={{ backgroundImage: "linear-gradient(to bottom, rgba(2, 6, 23, 0.8), rgba(2, 6, 23, 1)), url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1500&q=80')" }}
    >
      <Trophy className="h-20 w-20 text-lime-400 mb-6 z-10 drop-shadow-[0_0_20px_rgba(132,204,22,0.6)]" />
      <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight z-10 mb-6 uppercase">
        La Gran Porra del <span className="text-lime-400">Mundial 2026</span>
      </h1>
      <p className="max-w-2xl text-base sm:text-lg text-slate-300 z-10 mb-10 font-medium leading-relaxed">
        Demuestra tus conocimientos de fútbol en el barrio. Elige tus 4 favoritos en su posición exacta, realiza un seguimiento de los marcadores en tiempo real y compite por el gran premio acumulado.
      </p>
      <button 
        onClick={() => setCurrentTab('login')}
        className="z-10 bg-lime-500 hover:bg-lime-400 text-slate-900 font-extrabold text-lg px-8 sm:px-10 py-4 sm:py-5 rounded-full shadow-[0_0_30px_rgba(132,204,22,0.4)] transition-all transform hover:scale-105 cursor-pointer"
      >
        ¡Participar Ahora!
      </button>
    </div>

    {/* Funcionamiento */}
    <div className="max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <h2 className="text-3xl font-black text-white text-center mb-12 tracking-wide uppercase">¿Cómo funciona el torneo?</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl hover:border-slate-700 transition-all">
          <div className="bg-lime-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <CheckCircle className="text-lime-400 h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">1. Selecciona 4 Favoritos</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Regístrate y selecciona a tus cuatro favoritos indicando la posición exacta del podio (1º, 2º, 3º y 4º). Una vez guardados, no se admiten cambios.
          </p>
        </div>
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl hover:border-slate-700 transition-all">
          <div className="bg-blue-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <Euro className="text-blue-400 h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">2. Cuota de Inscripción</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Para validar tus pronósticos debes realizar un Bizum de <strong>20€</strong> al organizador incluyendo tu nombre de usuario en el concepto del pago.
          </p>
        </div>
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl hover:border-slate-700 transition-all">
          <div className="bg-purple-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <Trophy className="text-purple-400 h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">3. Distribución del Premio</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            El bote íntegro acumulado se distribuirá de forma directa entre los tres mejores puntuados del barrio al finalizar la copa mundial.
          </p>
        </div>
      </div>

      {/* Reglas de la Porra */}
      <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-slate-900 border-l-4 border-lime-500 p-6 rounded-r-2xl shadow-md">
          <h4 className="text-white font-extrabold text-base mb-4 flex items-center">
            <Trophy className="h-5 w-5 text-lime-400 mr-2" />
            Estructura de Premios
          </h4>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex justify-between border-b border-slate-800 pb-2">
              <span>🥇 1º Clasificado</span>
              <span className="font-extrabold text-lime-400">60% del Bote</span>
            </li>
            <li className="flex justify-between border-b border-slate-800 pb-2">
              <span>🥈 2º Clasificado</span>
              <span className="font-extrabold text-slate-200">25% del Bote</span>
            </li>
            <li className="flex justify-between border-b border-slate-800 pb-2">
              <span>🥉 3º Clasificado</span>
              <span className="font-extrabold text-orange-400">15% del Bote</span>
            </li>
          </ul>
          <div className="mt-4 p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-400 leading-relaxed">
            <strong className="text-lime-400">Desempates:</strong> Si se produce un empate a puntos en posiciones ganadoras, el premio de esa posición se repartirá a partes proporcionales e iguales entre los implicados.
          </div>
        </div>
        <div className="bg-slate-900 border-l-4 border-blue-500 p-6 rounded-r-2xl shadow-md">
          <h4 className="text-white font-extrabold text-base mb-4 flex items-center">
            <BarChart2 className="h-5 w-5 text-blue-400 mr-2" />
            Tabla de Puntuación
          </h4>
          <p className="text-xs text-slate-400 mb-3">Tus cuatro elecciones irán sumando puntos acumulativos según avancen en el mundial real:</p>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex justify-between border-b border-slate-800 pb-2">
              <span>Por alcanzar Semifinales</span>
              <span className="font-extrabold text-blue-400">+5 pts</span>
            </li>
            <li className="flex justify-between border-b border-slate-800 pb-2">
              <span>Por alcanzar la Gran Final</span>
              <span className="font-extrabold text-blue-400">+10 pts</span>
            </li>
            <li className="flex justify-between border-b border-slate-800 pb-2">
              <span>Por proclamarse Campeón</span>
              <span className="font-extrabold text-blue-400">+20 pts</span>
            </li>
          </ul>
        </div>
        <div className="bg-red-950/20 border-l-4 border-red-500 p-6 rounded-r-2xl shadow-md flex flex-col justify-center">
          <h4 className="text-red-400 font-extrabold text-base mb-2 flex items-center">
            <ShieldAlert className="h-5 w-5 mr-2" />
            Derecho de Admisión
          </h4>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            El administrador se reserva de forma estricta el derecho de anular los pronósticos y retirar de la tabla de clasificación a aquellos participantes inscritos que no completen el Bizum requerido antes del pitido inicial del mundial.
          </p>
        </div>
      </div>
      
      <div className="mt-12 text-center text-xs text-slate-600 border-t border-slate-800 pt-6">
        <p>Fuente de datos: Selecciones nacionales confirmadas oficialmente por la FIFA para la Fase de Grupos del Mundial de Fútbol 2026. Todos los derechos reservados.</p>
      </div>
    </div>
  </div>
);

const LoginPage = ({ 
  email, setEmail, 
  password, setPassword, 
  isRegistering, setIsRegistering, 
  handleAuth, submitting, errorMsg 
}) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-950">
      <div className="bg-slate-900 max-w-md w-full rounded-2xl shadow-2xl p-8 border border-slate-800">
        <div className="text-center mb-6">
          <Trophy className="h-12 w-12 text-lime-400 mx-auto mb-3" />
          <h2 className="text-3xl font-black text-white tracking-tight uppercase">Portal de Acceso</h2>
          <p className="text-slate-400 mt-2 text-sm leading-relaxed">
            {isRegistering 
              ? "Regístrate hoy para empezar a planificar tus favoritos." 
              : "Inicia sesión para gestionar tus apuestas y seguir el Bote."}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 bg-red-500/10 border border-red-500/50 p-3 rounded-lg flex items-start text-red-400 text-xs">
            <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-all"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Contraseña</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-all"
              placeholder="••••••••"
              minLength={6}
            />
          </div>
          <button 
            type="submit"
            disabled={submitting}
            className="w-full bg-lime-500 hover:bg-lime-600 text-slate-900 font-bold py-3 px-4 rounded-lg transition-all flex justify-center items-center cursor-pointer shadow-lg shadow-lime-500/10 hover:shadow-lime-500/20"
          >
            {submitting ? (
              <Loader2 className="animate-spin h-5 w-5 text-slate-900" />
            ) : (
              <>
                {isRegistering ? "Completar Registro" : "Acceder al Portal"}
                <ChevronRight className="ml-2 h-5 w-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-slate-850 pt-4">
          <button 
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
            }}
            className="text-xs text-slate-400 hover:text-white transition-all underline cursor-pointer"
          >
            {isRegistering ? "¿Ya tienes una cuenta? Inicia sesión aquí" : "¿Aún no participas? Registra tu cuenta"}
          </button>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ 
  user, profile, setProfile, 
  userPicks, updatePick, isLocked, 
  leaderboardData, matchesData, 
  submitting, requestLockPicks 
}) => {
  const [activeView, setActiveView] = useState('picks');

  const hasNameVal = profile.name && profile.name.trim() !== '';
  const hasPhoneVal = profile.phone && profile.phone.trim() !== '';
  
  const picksArray = Object.values(userPicks);
  const hasAllPicksVal = picksArray.length === 4 && picksArray.every(p => p !== '');
  const uniqueTeams = new Set(picksArray.filter(p => p !== ''));
  const isUniqueVal = uniqueTeams.size === 4;

  const isFormValid = hasNameVal && hasPhoneVal && hasAllPicksVal && isUniqueVal;

  const getValidationFeedback = () => {
    if (!hasNameVal) return "⚠️ Falta introducir el Nombre o Apodo de la Tabla.";
    if (!hasPhoneVal) return "⚠️ Falta introducir el Teléfono Móvil (Requerido para Bizum).";
    if (!hasAllPicksVal) return "⚠️ Debes seleccionar una selección para cada uno de los 4 puestos.";
    if (!isUniqueVal) return "⚠️ Tienes selecciones repetidas. Cada puesto debe ser un país diferente.";
    return null;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        
        {profile && !profile.has_paid && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-6 flex items-start sm:items-center">
            <AlertCircle className="text-orange-500 h-5 w-5 mt-0.5 sm:mt-0 mr-3 flex-shrink-0 animate-pulse" />
            <div className="flex-1">
              <p className="text-orange-400 text-sm font-bold">Inscripción Pendiente de Pago</p>
              <p className="text-slate-400 text-xs mt-1">
                Recuerda tramitar el Bizum de 20€ para validar tus pronósticos. Si la porra inicia sin tu abono, tus favoritos serán borrados del sistema.
              </p>
            </div>
          </div>
        )}

        <div className="flex overflow-x-auto bg-slate-900 border border-slate-800 mb-6 p-2 space-x-2 rounded-xl">
          <button 
            onClick={() => setActiveView('picks')} 
            className={`flex items-center px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${activeView === 'picks' ? 'bg-lime-500 text-slate-900 shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <CheckCircle className="w-4 h-4 mr-2" /> Mis Favoritos
          </button>
          <button 
            onClick={() => setActiveView('leaderboard')} 
            className={`flex items-center px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${activeView === 'leaderboard' ? 'bg-lime-500 text-slate-900 shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Users className="w-4 h-4 mr-2" /> Clasificación Global
          </button>
          <button 
            onClick={() => setActiveView('matches')} 
            className={`flex items-center px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${activeView === 'matches' ? 'bg-lime-500 text-slate-900 shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Calendar className="w-4 h-4 mr-2" /> Resultados y Partidos
          </button>
        </div>

        {activeView === 'picks' && (
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl">
              <h3 className="text-lg font-extrabold text-white mb-4 uppercase flex items-center">
                <User className="h-5 w-5 text-lime-400 mr-2" />
                1. Datos Identificativos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Nombre o Apodo de la Tabla</label>
                  <input 
                    type="text" 
                    value={profile.name || ''} 
                    onChange={(e) => setProfile({...profile, name: e.target.value})} 
                    disabled={isLocked || submitting} 
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 disabled:opacity-50 transition-all font-bold" 
                    placeholder="Ej: Vecino_77"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Teléfono Móvil (Validación Bizum)</label>
                  <input 
                    type="tel" 
                    value={profile.phone || ''} 
                    onChange={(e) => setProfile({...profile, phone: e.target.value})} 
                    disabled={isLocked || submitting} 
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 disabled:opacity-50 transition-all font-bold" 
                    placeholder="Ej: 600123456"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl">
              <h3 className="text-lg font-extrabold text-white mb-2 uppercase flex items-center">
                <Trophy className="h-5 w-5 text-lime-400 mr-2" />
                2. Pronóstico Mundialista (Puesto Exacto)
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm mb-6 leading-relaxed">
                {isLocked 
                  ? "Tus pronósticos están bloqueados y asegurados en la base de datos de manera oficial." 
                  : "Asigna un único país para cada puesto. No se permiten elecciones duplicadas en el formulario."}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { id: 'first', label: '1º Campeón del Mundo', color: 'text-yellow-400', bg: 'bg-yellow-500/5', border: 'border-yellow-500/20' },
                  { id: 'second', label: '2º Subcampeón', color: 'text-slate-300', bg: 'bg-slate-300/5', border: 'border-slate-300/20' },
                  { id: 'third', label: '3º Tercer Puesto', color: 'text-orange-400', bg: 'bg-orange-500/5', border: 'border-orange-500/20' },
                  { id: 'fourth', label: '4º Cuarto Puesto', color: 'text-slate-500', bg: 'bg-slate-400/5', border: 'border-slate-400/20' }
                ].map(pos => (
                  <div key={pos.id} className={`p-5 rounded-2xl border ${pos.border} ${pos.bg}`}>
                    <label className={`block text-sm font-bold mb-3 ${pos.color}`}>{pos.label}</label>
                    <select 
                      value={userPicks[pos.id] || ''} 
                      onChange={(e) => updatePick(pos.id, e.target.value)} 
                      disabled={isLocked || submitting} 
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 disabled:opacity-50 transition-all cursor-pointer font-bold"
                    >
                      <option value="">-- Escoger Selección --</option>
                      {TEAMS.map(team => {
                        const isSelectedElsewhere = Object.entries(userPicks).some(([key, val]) => key !== pos.id && val === team.id);
                        return (
                          <option key={team.id} value={team.id} disabled={isSelectedElsewhere}>
                            {team.flag} {team.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                ))}
              </div>

              {!isLocked && (
                <div className="mt-8 flex flex-col items-end">
                  {!isFormValid && (
                    <p className="text-orange-400 text-xs sm:text-sm mb-4 flex items-center bg-orange-500/5 border border-orange-500/20 rounded-lg py-2 px-3">
                      <AlertCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />
                      <span>{getValidationFeedback()}</span>
                    </p>
                  )}
                  <button 
                    onClick={requestLockPicks} 
                    disabled={!isFormValid || submitting}
                    className={`px-6 py-3.5 rounded-lg text-sm font-extrabold transition-all flex items-center cursor-pointer
                      ${isFormValid && !submitting
                        ? 'bg-lime-500 text-slate-900 hover:bg-lime-400 shadow-[0_0_20px_rgba(132,204,22,0.3)]' 
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                    `}
                  >
                    {submitting && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                    Confirmar y Guardar Apuesta
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'leaderboard' && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider">Clasificación Global</h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Bote total estimado acumulado: <span className="text-lime-400 font-extrabold">{leaderboardData.length * 20}€</span>
                </p>
              </div>
              <BarChart2 className="h-6 w-6 text-slate-500" />
            </div>
            <div className="overflow-x-auto">
              {leaderboardData.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <Trophy className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Aún no hay apuestas guardadas en el sistema.</p>
                  <p className="text-xs text-slate-600 mt-1">¡Sé el primero de tu barrio en rellenar tus favoritos!</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm text-slate-400">
                  <thead className="text-xs uppercase bg-slate-950/50 text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-bold tracking-wider">Pos</th>
                      <th className="px-6 py-4 font-bold tracking-wider">Participante</th>
                      <th className="px-6 py-4 font-bold tracking-wider">Pronósticos (1º al 4º)</th>
                      <th className="px-6 py-4 font-bold tracking-wider text-center">Puntos</th>
                      <th className="px-6 py-4 font-bold tracking-wider text-center">Inscripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.map((p, idx) => (
                      <tr key={p.id} className="border-b border-slate-850 hover:bg-slate-800/20 transition-all duration-150">
                        <td className="px-6 py-4 font-black text-white text-base">{idx + 1}</td>
                        <td className="px-6 py-4 font-bold text-slate-200">
                          <div className="flex flex-col">
                            <span>{p.name}</span>
                            {p.phone && <span className="text-[10px] text-slate-500 font-normal">{p.phone}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            {p.picks ? (
                              ['first', 'second', 'third', 'fourth'].map((pos, i) => {
                                const team = TEAMS.find(t => t.id === p.picks[pos]);
                                const posColors = ['border-yellow-400', 'border-slate-300', 'border-orange-400', 'border-slate-650'];
                                return (
                                  <span 
                                    key={pos} 
                                    title={`${i + 1}º - ${team?.name || '❓'}`} 
                                    className={`text-lg bg-slate-950 px-2.5 py-0.5 rounded border-b-2 ${posColors[i]} shadow-inner select-none cursor-help`}
                                  >
                                    {team?.flag || '❓'}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-xs text-slate-500 italic">Pendiente de rellenar favoritos</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-extrabold text-lime-400 text-base">{p.points}</td>
                        <td className="px-6 py-4 text-center">
                          {p.hasPaid ? (
                            <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Validado
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                              Impago
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeView === 'matches' && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-black text-white uppercase tracking-wider">Estructura y Resultados Oficiales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matchesData.map(match => (
                <div key={match.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-800/50 pb-3">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-lime-400 uppercase tracking-widest mb-1">{match.phase}</span>
                      <span className="text-xs font-bold text-slate-400">
                        {match.date}
                      </span>
                    </div>
                    <span className={`text-[10px] uppercase font-extrabold px-2 py-1 rounded-md ${match.status === 'Finalizado' ? 'bg-slate-800 text-slate-400' : match.status === 'Por definir' ? 'bg-slate-800/50 text-slate-500' : 'bg-lime-500/20 text-lime-400'}`}>
                      {match.status}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center space-x-4">
                    <div className="flex items-center space-x-3 w-5/12">
                      <span className="text-3xl select-none">{match.flag1}</span>
                      <span className="font-bold text-white text-sm sm:text-base truncate">{match.team1}</span>
                    </div>
                    
                    <div className="w-2/12 flex justify-center items-center space-x-1.5 bg-slate-950 py-2 px-3 rounded-xl border border-slate-850">
                      <span className="text-base font-extrabold text-white">{match.score1}</span>
                      <span className="text-slate-600 font-bold">-</span>
                      <span className="text-base font-extrabold text-white">{match.score2}</span>
                    </div>

                    <div className="flex items-center justify-end space-x-3 w-5/12 text-right">
                      <span className="font-bold text-white text-sm sm:text-base truncate">{match.team2}</span>
                      <span className="text-3xl select-none">{match.flag2}</span>
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

export default function App() {
  const [user, setUser] = useState(null); 
  const [currentTab, setCurrentTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [profile, setProfile] = useState({ name: '', phone: '', has_paid: false, points: 0 });
  const [userPicks, setUserPicks] = useState({ first: '', second: '', third: '', fourth: '' });
  const [isLocked, setIsLocked] = useState(false);

  const [leaderboardData, setLeaderboardData] = useState([]);
  const [matchesData, setMatchesData] = useState([]);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const closeToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  const fetchUserData = async (client, userId) => {
    try {
      if (!client) {
        const db = getLocalDb();
        const prof = db.profiles.find(p => p.id === userId);
        if (prof) {
          setProfile({
            name: prof.name || '',
            phone: prof.phone || '',
            has_paid: prof.has_paid,
            points: prof.points || 0
          });
        }
        const picks = db.picks.find(p => p.user_id === userId);
        if (picks) {
          setUserPicks({
            first: picks.first_place || '',
            second: picks.second_place || '',
            third: picks.third_place || '',
            fourth: picks.fourth_place || ''
          });
          setIsLocked(true);
        } else {
          setIsLocked(false);
        }
        return;
      }

      const { data: profData, error: profErr } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profErr && profErr.code !== 'PGRST116') throw profErr;

      if (profData) {
        setProfile({
          name: profData.name || '',
          phone: profData.phone || '',
          has_paid: profData.has_paid,
          points: profData.points || 0
        });
      }

      const { data: picksData, error: picksErr } = await client
        .from('picks')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (picksErr && picksErr.code !== 'PGRST116') throw picksErr;

      if (picksData) {
        setUserPicks({
          first: picksData.first_place || '',
          second: picksData.second_place || '',
          third: picksData.third_place || '',
          fourth: picksData.fourth_place || ''
        });
        setIsLocked(true);
      } else {
        setIsLocked(false);
      }
    } catch (err) {
      console.error("Error al obtener datos:", err.message);
    }
  };

  const loadGlobalData = async (client) => {
    try {
      if (!client) {
        const db = getLocalDb();
        const merged = db.profiles.map(prof => {
          const userPick = db.picks.find(pk => pk.user_id === prof.id);
          return {
            id: prof.id,
            name: prof.name || 'Participante',
            phone: prof.phone || '',
            points: prof.points || 0,
            hasPaid: prof.has_paid,
            picks: userPick ? {
              first: userPick.first_place,
              second: userPick.second_place,
              third: userPick.third_place,
              fourth: userPick.fourth_place
            } : null
          };
        }).sort((a, b) => b.points - a.points);

        setLeaderboardData(merged);
        setMatchesData(db.matches);
        return;
      }

      const { data: profiles, error: pErr } = await client.from('profiles').select('*');
      if (pErr) throw pErr;

      const { data: picks, error: pkErr } = await client.from('picks').select('*');
      if (pkErr) throw pkErr;

      const merged = (profiles || []).map(prof => {
        const userPick = (picks || []).find(pk => pk.user_id === prof.id);
        return {
          id: prof.id,
          name: prof.name || 'Participante',
          phone: prof.phone || '',
          points: prof.points || 0,
          hasPaid: prof.has_paid,
          picks: userPick ? {
            first: userPick.first_place,
            second: userPick.second_place,
            third: userPick.third_place,
            fourth: userPick.fourth_place
          } : null
        };
      }).sort((a, b) => b.points - a.points);

      setLeaderboardData(merged);

      const { data: matches, error: mErr } = await client
        .from('matches')
        .select('*')
        .order('id', { ascending: true });

      if (mErr) throw mErr;
      if (matches) setMatchesData(matches);
    } catch (err) {
      console.error("Error cargando clasificación global:", err.message);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      const client = await getSupabaseClient();
      
      if (client) {
        const { data: { session } } = await client.auth.getSession();
        if (session) {
          setUser({ id: session.user.id, email: session.user.email, name: session.user.email.split('@')[0] });
          await fetchUserData(client, session.user.id);
          setCurrentTab('dashboard');
        }

        const { data: { subscription } } = client.auth.onAuthStateChange(async (_event, session) => {
          if (session) {
            setUser({ id: session.user.id, email: session.user.email, name: session.user.email.split('@')[0] });
            await fetchUserData(client, session.user.id);
            setCurrentTab('dashboard');
          } else {
            setUser(null);
            setCurrentTab('home');
          }
        });

        await loadGlobalData(client);
        setLoading(false);
        return () => subscription.unsubscribe();
      } else {
        const storedUser = localStorage.getItem('mundialbet_session');
        if (storedUser) {
          const u = JSON.parse(storedUser);
          setUser(u);
          await fetchUserData(null, u.id);
          setCurrentTab('dashboard');
        }
        await loadGlobalData(null);
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setSubmitting(true);

    try {
      const client = await getSupabaseClient();

      if (!client) {
        const id = 'mock_' + loginEmail.split('@')[0];
        const loggedUser = { id, email: loginEmail, name: loginEmail.split('@')[0] };
        
        const db = getLocalDb();
        if (isRegistering) {
          const userExists = db.profiles.some(p => p.id === id);
          if (userExists) {
            throw new Error("El usuario ya existe en la porra simulada.");
          }
          db.profiles.push({ id, name: loginEmail.split('@')[0], phone: '', has_paid: false, points: 0 });
          saveLocalDb(db);
          showToast("¡Registro simulado completado con éxito!", 'success');
        } else {
          const userExists = db.profiles.some(p => p.id === id);
          if (!userExists) {
            db.profiles.push({ id, name: loginEmail.split('@')[0], phone: '', has_paid: false, points: 0 });
            saveLocalDb(db);
          }
        }

        localStorage.setItem('mundialbet_session', JSON.stringify(loggedUser));
        setUser(loggedUser);
        await fetchUserData(null, id);
        await loadGlobalData(null);
        setCurrentTab('dashboard');
        setSubmitting(false);
        return;
      }

      if (isRegistering) {
        const { data, error } = await client.auth.signUp({
          email: loginEmail,
          password: loginPass,
        });

        if (error) throw error;

        if (data.user) {
          const { error: insertErr } = await client
            .from('profiles')
            .insert({
              id: data.user.id,
              name: loginEmail.split('@')[0],
              phone: '',
              has_paid: false,
              points: 0
            });

          if (insertErr) throw insertErr;

          setUser({ id: data.user.id, email: data.user.email, name: loginEmail.split('@')[0] });
          await fetchUserData(client, data.user.id);
          showToast("¡Registro completado! Por favor, inicia sesión.", 'success');
          setIsRegistering(false);
        }
      } else {
        const { data, error } = await client.auth.signInWithPassword({
          email: loginEmail,
          password: loginPass,
        });

        if (error) throw error;

        if (data.user) {
          setUser({ id: data.user.id, email: data.user.email, name: data.user.email.split('@')[0] });
          await fetchUserData(client, data.user.id);
          await loadGlobalData(client);
          setCurrentTab('dashboard');
          showToast("¡Sesión iniciada correctamente!", 'success');
        }
      }
    } catch (err) {
      setAuthError(err.message || 'Error en el proceso de autenticación.');
      showToast(err.message || 'Error de acceso.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    const client = await getSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
    localStorage.removeItem('mundialbet_session');
    setUser(null);
    setProfile({ name: '', phone: '', has_paid: false, points: 0 });
    setUserPicks({ first: '', second: '', third: '', fourth: '' });
    setIsLocked(false);
    setLoginEmail('');
    setLoginPass('');
    setCurrentTab('home');
    showToast("Sesión cerrada correctamente.", 'success');
  };

  const updatePick = (position, teamId) => {
    if (isLocked) return;
    setUserPicks(prev => ({ ...prev, [position]: teamId }));
  };

  const requestLockPicks = () => {
    setConfirmModal({
      show: true,
      title: "Confirmar Pronósticos",
      message: "¿Estás completamente seguro de registrar esta apuesta? Una vez confirmados, los 4 equipos favoritos quedarán fijados y no podrán ser modificados de ninguna manera.",
      onConfirm: async () => {
        await executeLockPicks();
      }
    });
  };

  const executeLockPicks = async () => {
    if (!user) return;
    setSubmitting(true);

    try {
      const client = await getSupabaseClient();

      if (!client) {
        const db = getLocalDb();
        const profIdx = db.profiles.findIndex(p => p.id === user.id);
        if (profIdx > -1) {
          db.profiles[profIdx].name = profile.name;
          db.profiles[profIdx].phone = profile.phone;
        } else {
          db.profiles.push({
            id: user.id,
            name: profile.name,
            phone: profile.phone,
            has_paid: false,
            points: 0
          });
        }

        db.picks = db.picks.filter(p => p.user_id !== user.id);
        db.picks.push({
          id: 'p_user_' + user.id,
          user_id: user.id,
          first_place: userPicks.first,
          second_place: userPicks.second,
          third_place: userPicks.third,
          fourth_place: userPicks.fourth
        });

        saveLocalDb(db);
        setIsLocked(true);
        showToast("¡Pronósticos asegurados localmente!", 'success');
        await loadGlobalData(null);
        setSubmitting(false);
        return;
      }

      const { error: profErr } = await client
        .from('profiles')
        .upsert({
          id: user.id,
          name: profile.name,
          phone: profile.phone,
          has_paid: profile.has_paid,
          points: profile.points
        });

      if (profErr) throw profErr;

      const { error: picksErr } = await client
        .from('picks')
        .insert({
          user_id: user.id,
          first_place: userPicks.first,
          second_place: userPicks.second,
          third_place: userPicks.third,
          fourth_place: userPicks.fourth
        });

      if (picksErr) throw picksErr;

      setIsLocked(true);
      showToast("¡Apuesta guardada y confirmada con éxito en la base de datos!", 'success');
      await loadGlobalData(client);
    } catch (err) {
      showToast("Error al guardar apuesta: " + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-slate-300">
        <Loader2 className="animate-spin h-10 w-10 text-lime-400 mb-4" />
        <p className="font-semibold text-slate-400 text-sm tracking-wide">Iniciando Portal Mundialista...</p>
      </div>
    );
  }

  return (
    <div className="font-sans bg-slate-950 min-h-screen text-slate-300 select-none">
      <Navbar user={user} setCurrentTab={setCurrentTab} handleLogout={handleLogout} />
      
      {currentTab === 'home' && <LandingPage setCurrentTab={setCurrentTab} />}
      
      {currentTab === 'login' && (
        <LoginPage 
          email={loginEmail} setEmail={setLoginEmail}
          password={loginPass} setPassword={setLoginPass}
          isRegistering={isRegistering} setIsRegistering={setIsRegistering}
          handleAuth={handleAuth}
          submitting={submitting}
          errorMsg={authError}
        />
      )}
      
      {currentTab === 'dashboard' && (
        <Dashboard 
          user={user}
          profile={profile} setProfile={setProfile}
          userPicks={userPicks} updatePick={updatePick}
          isLocked={isLocked}
          leaderboardData={leaderboardData}
          matchesData={matchesData}
          submitting={submitting}
          requestLockPicks={requestLockPicks}
        />
      )}

      <ToastNotification toast={toast} onClose={closeToast} />
      <ConfirmationModal 
        modal={confirmModal} 
        onClose={() => setConfirmModal(prev => ({ ...prev, show: false }))} 
        onConfirm={confirmModal.onConfirm} 
      />
    </div>
  );
}