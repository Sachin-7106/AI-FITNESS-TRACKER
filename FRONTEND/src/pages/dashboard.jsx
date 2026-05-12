import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Plus, X, Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function Dashboard() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const reportRef = useRef(null);
  const navigate = useNavigate();
  
  const username = localStorage.getItem("username");
  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    const fetchHistory = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || "http://127.0.0.1:5000"}/history/${userId}`);
        const data = await response.json();
        setHistory(data);
      } catch (err) {
        console.error("Failed to fetch history", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [userId, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const downloadPDF = async () => {
    if (!reportRef.current) return;
    
    try {
      const canvas = await html2canvas(reportRef.current, { 
        scale: 2,
        backgroundColor: "#000000"
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("gainlens-report.pdf");
    } catch (err) {
      console.error("Failed to generate PDF", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-white text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-zinc-400">Welcome back, {username}</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => navigate("/upload")}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 transition-all duration-300 text-white px-5 py-3 rounded-xl font-bold"
            >
              <Plus size={20} />
              New Analysis
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 transition-all duration-300 text-white px-5 py-3 rounded-xl font-bold border border-zinc-700"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-zinc-400 py-20">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="bg-zinc-950 p-10 rounded-3xl border border-zinc-800 text-center">
            <h2 className="text-white text-2xl font-bold mb-4">No analyses yet</h2>
            <p className="text-zinc-400 mb-6">Start tracking your fitness progress today.</p>
            <button
              onClick={() => navigate("/upload")}
              className="bg-green-500 hover:bg-green-600 transition-all duration-300 text-white px-8 py-3 rounded-xl font-bold text-lg"
            >
              Start First Analysis
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((item) => (
              <div key={item.id} className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-white text-xl font-bold">{new Date(item.date).toLocaleDateString()}</h3>
                  <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-semibold border border-green-500/30">
                    {item.progressPercent}% Progress
                  </span>
                </div>
                <p className="text-zinc-300 text-lg mb-4 line-clamp-2">{item.verdict}</p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                    <p className="text-zinc-500 text-sm mb-1">Posture</p>
                    <p className="text-white font-bold">{item.metrics.postureScore}</p>
                  </div>
                  <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                    <p className="text-zinc-500 text-sm mb-1">Symmetry</p>
                    <p className="text-white font-bold">{item.metrics.symmetryScore}</p>
                  </div>
                </div>
                <div className="flex gap-2 mb-4">
                  <img src={item.skeletons.newFront} alt="thumb" className="w-1/2 h-24 object-cover rounded-xl border border-zinc-700 opacity-80" />
                  <img src={item.skeletons.newSide} alt="thumb" className="w-1/2 h-24 object-cover rounded-xl border border-zinc-700 opacity-80" />
                </div>
                <button
                  onClick={() => setSelectedItem(item)}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-colors border border-zinc-700"
                >
                  View More Details
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Modal for Details */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 overflow-y-auto">
            <div className="bg-zinc-950 w-full max-w-4xl rounded-3xl border border-zinc-800 my-auto relative max-h-[90vh] flex flex-col">
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-6 right-6 text-zinc-400 hover:text-white transition-colors z-10"
              >
                <X size={24} />
              </button>
              
              <div className="p-8 overflow-y-auto flex-1">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-white text-3xl font-bold">{selectedItem.verdict}</h2>
                  <button
                    onClick={downloadPDF}
                    className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl transition-colors border border-zinc-700 mr-10"
                  >
                    <Download size={20} />
                    Download PDF
                  </button>
                </div>

                <div ref={reportRef} className="space-y-10 bg-zinc-950 p-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800">
                      <p className="text-zinc-400 mb-2">Progress</p>
                      <h2 className="text-green-400 text-4xl font-bold">{selectedItem.progressPercent}%</h2>
                    </div>
                    <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800">
                      <p className="text-zinc-400 mb-2">Body Ratio</p>
                      <h2 className="text-white text-4xl font-bold">{selectedItem.metrics.bodyRatio}</h2>
                    </div>
                    <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800">
                      <p className="text-zinc-400 mb-2">Posture Score</p>
                      <h2 className="text-white text-4xl font-bold">{selectedItem.metrics.postureScore}</h2>
                    </div>
                    <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800">
                      <p className="text-zinc-400 mb-2">Confidence</p>
                      <h2 className="text-white text-4xl font-bold">{selectedItem.metrics.confidence}</h2>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white text-2xl font-bold mb-6 text-center">Progress Analytics</h3>
                    <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: "Body Ratio", value: selectedItem.metrics.bodyRatio },
                          { name: "Posture", value: selectedItem.metrics.postureScore },
                          { name: "Confidence", value: selectedItem.metrics.confidence }
                        ]}>
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" radius={[10, 10, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {selectedItem.advice?.map((item, index) => (
                      <div key={index} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                        <p className="text-zinc-300 text-lg">{item}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h3 className="text-white text-2xl font-bold mb-6 text-center">AI Skeleton Analysis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-white mb-2">Old Front</p>
                        <img src={selectedItem.skeletons.oldFront} alt="old front skeleton" className="rounded-2xl border border-zinc-700 w-full" />
                      </div>
                      <div>
                        <p className="text-white mb-2">New Front</p>
                        <img src={selectedItem.skeletons.newFront} alt="new front skeleton" className="rounded-2xl border border-zinc-700 w-full" />
                      </div>
                      <div>
                        <p className="text-white mb-2">Old Side</p>
                        <img src={selectedItem.skeletons.oldSide} alt="old side skeleton" className="rounded-2xl border border-zinc-700 w-full" />
                      </div>
                      <div>
                        <p className="text-white mb-2">New Side</p>
                        <img src={selectedItem.skeletons.newSide} alt="new side skeleton" className="rounded-2xl border border-zinc-700 w-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}