import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { dashboardAPI } from '../api/dashboard';
import { MdPeople, MdDevices, MdSchedule, MdPendingActions } from 'react-icons/md';

const Dashboard = () => {
  const [stats, setStats] = useState({ totalStudents: 0, totalKiosks: 0, totalSchedules: 0, pendingRegistrations: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try { setStats(await dashboardAPI.getStats()); } 
      catch (e) { console.error(e); } 
      finally { setLoading(false); }
    };
    load();
  }, []);

  const cards = [
    { title: 'Total Students', value: stats.totalStudents, icon: MdPeople },
    { title: 'Active Kiosks', value: stats.totalKiosks, icon: MdDevices },
    { title: 'Class Schedules', value: stats.totalSchedules, icon: MdSchedule },
    { title: 'Pending Requests', value: stats.pendingRegistrations, icon: MdPendingActions },
  ];

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div>
    </div>
  );

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-brand-dark">Dashboard</h1>
          <p className="text-brand-charcoal/70 mt-1">Overview of your attendance system</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c, i) => (
          <motion.div
            key={i}
            className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-brand-orange hover:shadow-xl transition-all"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-brand-charcoal/50 uppercase tracking-wider">{c.title}</p>
                <p className="text-4xl font-bold text-brand-dark mt-2">{c.value}</p>
              </div>
              <div className="p-3 bg-brand-beige text-brand-orange rounded-xl">
                <c.icon size={28} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Add Chart or Activity placeholders here if needed */}
    </motion.div>
  );
};

export default Dashboard;