import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ArrowLeft, Download } from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

function Upload() {
  const navigate = useNavigate();
  const reportRef = useRef(null);
  const userId = localStorage.getItem("user_id");

  const [verdict, setVerdict] = useState("");
  const [advice, setAdvice] = useState([]);

  const [metrics, setMetrics] = useState(null);
  const [progressPercent, setProgressPercent] = useState(0);

  const chartData = metrics ? [

    {
      name: "Body Ratio",
      value: metrics.bodyRatio
    },

    {
      name: "Posture",
      value: metrics.postureScore
    },

    {
      name: "Confidence",
      value: metrics.confidence
    }

  ] : [];

  const [oldFront, setOldFront] = useState(null);
  const [oldSide, setOldSide] = useState(null);

  const [newFront, setNewFront] = useState(null);
  const [newSide, setNewSide] = useState(null);

  const [oldFrontPreview, setOldFrontPreview] = useState(null);
  const [oldSidePreview, setOldSidePreview] = useState(null);

  const [newFrontPreview, setNewFrontPreview] = useState(null);
  const [newSidePreview, setNewSidePreview] = useState(null);

  const [skeletons, setSkeletons] = useState({});

  const handleImage = (e, type) => {

    const file = e.target.files[0];

    if (!file) return;

    const preview = URL.createObjectURL(file);

    if (type === "oldFront") {
      setOldFront(file);
      setOldFrontPreview(preview);
    }

    if (type === "oldSide") {
      setOldSide(file);
      setOldSidePreview(preview);
    }

    if (type === "newFront") {
      setNewFront(file);
      setNewFrontPreview(preview);
    }

    if (type === "newSide") {
      setNewSide(file);
      setNewSidePreview(preview);
    }
  };

  const analyzeProgress = async () => {

    const formData = new FormData();

    formData.append("oldFront", oldFront);
    formData.append("oldSide", oldSide);

    formData.append("newFront", newFront);
    formData.append("newSide", newSide);
    if (userId) {
      formData.append("user_id", userId);
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_URL || "http://127.0.0.1:5000"}/analyze`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    setVerdict(data.verdict);
    setAdvice(data.advice);

    setMetrics(data.metrics);

    setProgressPercent(
      data.progressPercent
    );

    if (data.skeletons) {
      setSkeletons(data.skeletons);
    }
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
      
        <div className="mb-6">
          <button 
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} /> Back to Dashboard
          </button>
        </div>

        <h1 className="text-white text-5xl font-bold text-center mb-3">
          GainLens AI
        </h1>

        <p className="text-zinc-400 text-center mb-10">
          AI-based physique and posture comparison system.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* OLD IMAGES */}
          <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800">

            <h2 className="text-white text-2xl font-bold mb-6 text-center">
              Old Images
            </h2>

            <div className="mb-8">

              <p className="text-zinc-300 mb-3">
                Front View
              </p>

              <label className="cursor-pointer block bg-zinc-900 border border-zinc-700 hover:border-green-500 hover:bg-zinc-800 transition-all text-center text-zinc-300 py-3 rounded-xl font-semibold">
                {oldFront ? oldFront.name : "Choose File"}
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => handleImage(e, "oldFront")}
                />
              </label>

              {oldFrontPreview && (
                <img
                  src={oldFrontPreview}
                  alt="old front"
                  className="w-full h-72 object-cover rounded-2xl mt-4 border border-zinc-700"
                />
              )}

            </div>

            <div>

              <p className="text-zinc-300 mb-3">
                Side View
              </p>

              <label className="cursor-pointer block bg-zinc-900 border border-zinc-700 hover:border-green-500 hover:bg-zinc-800 transition-all text-center text-zinc-300 py-3 rounded-xl font-semibold">
                {oldSide ? oldSide.name : "Choose File"}
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => handleImage(e, "oldSide")}
                />
              </label>

              {oldSidePreview && (
                <img
                  src={oldSidePreview}
                  alt="old side"
                  className="w-full h-72 object-cover rounded-2xl mt-4 border border-zinc-700"
                />
              )}

            </div>

          </div>

          {/* NEW IMAGES */}
          <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800">

            <h2 className="text-white text-2xl font-bold mb-6 text-center">
              New Images
            </h2>

            <div className="mb-8">

              <p className="text-zinc-300 mb-3">
                Front View
              </p>

              <label className="cursor-pointer block bg-zinc-900 border border-zinc-700 hover:border-green-500 hover:bg-zinc-800 transition-all text-center text-zinc-300 py-3 rounded-xl font-semibold">
                {newFront ? newFront.name : "Choose File"}
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => handleImage(e, "newFront")}
                />
              </label>

              {newFrontPreview && (
                <img
                  src={newFrontPreview}
                  alt="new front"
                  className="w-full h-72 object-cover rounded-2xl mt-4 border border-zinc-700"
                />
              )}

            </div>

            <div>

              <p className="text-zinc-300 mb-3">
                Side View
              </p>

              <label className="cursor-pointer block bg-zinc-900 border border-zinc-700 hover:border-green-500 hover:bg-zinc-800 transition-all text-center text-zinc-300 py-3 rounded-xl font-semibold">
                {newSide ? newSide.name : "Choose File"}
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => handleImage(e, "newSide")}
                />
              </label>

              {newSidePreview && (
                <img
                  src={newSidePreview}
                  alt="new side"
                  className="w-full h-72 object-cover rounded-2xl mt-4 border border-zinc-700"
                />
              )}

            </div>

          </div>

        </div>

        {/* ANALYZE BUTTON */}
        <button
          onClick={analyzeProgress}
          className="w-full mt-10 bg-green-500 hover:bg-green-600 transition-all duration-300 text-white p-4 rounded-2xl font-bold text-xl"
        >
          Analyze Progress
        </button>

        {/* RESULTS */}
        {(verdict || advice.length > 0) && (
          <div className="mt-10">
            <div className="flex justify-end mb-4">
              <button
                onClick={downloadPDF}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl transition-colors border border-zinc-700"
              >
                <Download size={20} />
                Download PDF
              </button>
            </div>
          
            <div ref={reportRef} className="bg-zinc-950 p-8 rounded-3xl border border-zinc-800">

            <h2 className="text-white text-3xl font-bold text-center mb-8">
              {verdict}
            </h2>

            {/* AI METRICS */}
            {metrics && (

              <div className="mb-10">

                <h3 className="text-white text-2xl font-bold mb-6 text-center">
                  AI Progress Metrics
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

                  <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800">

                    <p className="text-zinc-400 mb-2">
                      Progress
                    </p>

                    <h2 className="text-green-400 text-4xl font-bold">
                      {progressPercent}%
                    </h2>

                  </div>

                  <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800">

                    <p className="text-zinc-400 mb-2">
                      Body Ratio
                    </p>

                    <h2 className="text-white text-4xl font-bold">
                      {metrics.bodyRatio}
                    </h2>

                  </div>

                  <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800">

                    <p className="text-zinc-400 mb-2">
                      Posture Score
                    </p>

                    <h2 className="text-white text-4xl font-bold">
                      {metrics.postureScore}
                    </h2>

                  </div>

                  <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800">

                    <p className="text-zinc-400 mb-2">
                      Confidence
                    </p>

                    <h2 className="text-white text-4xl font-bold">
                      {metrics.confidence}
                    </h2>

                  </div>

                </div>

              </div>

            )}

            {/* AI CHART */}
            {metrics && (

              <div className="mb-10">

                <h3 className="text-white text-2xl font-bold mb-6 text-center">
                  Progress Analytics
                </h3>

                <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 h-96">

                  <ResponsiveContainer width="100%" height="100%">

                    <BarChart data={chartData}>

                      <XAxis dataKey="name" />

                      <YAxis />

                      <Tooltip />

                      <Bar
                        dataKey="value"
                        radius={[10, 10, 0, 0]}
                      />

                    </BarChart>

                  </ResponsiveContainer>

                </div>

              </div>

            )}

            {/* ADVICE */}
            <div className="space-y-4 mb-10">

              {advice.map((item, index) => (

                <div
                  key={index}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
                >
                  <p className="text-zinc-300 text-lg">
                    {item}
                  </p>
                </div>

              ))}

            </div>

            {/* SKELETON OVERLAYS */}
            {Object.keys(skeletons).length > 0 && (

              <div>

                <h3 className="text-white text-2xl font-bold mb-6 text-center">
                  AI Skeleton Analysis
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div>
                    <p className="text-white mb-2">
                      Old Front
                    </p>

                    <img
                      src={skeletons.oldFront}
                      alt="old front skeleton"
                      className="rounded-2xl border border-zinc-700"
                    />
                  </div>

                  <div>
                    <p className="text-white mb-2">
                      New Front
                    </p>

                    <img
                      src={skeletons.newFront}
                      alt="new front skeleton"
                      className="rounded-2xl border border-zinc-700"
                    />
                  </div>

                  <div>
                    <p className="text-white mb-2">
                      Old Side
                    </p>

                    <img
                      src={skeletons.oldSide}
                      alt="old side skeleton"
                      className="rounded-2xl border border-zinc-700"
                    />
                  </div>

                  <div>
                    <p className="text-white mb-2">
                      New Side
                    </p>

                    <img
                      src={skeletons.newSide}
                      alt="new side skeleton"
                      className="rounded-2xl border border-zinc-700"
                    />
                  </div>

                </div>

              </div>

            )}

            </div>
          </div>

        )}

      </div>

    </div>

  );
}

export default Upload;