import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";

export default function DashboardVideos() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [videoName, setVideoName] = useState([]);
  const [videoSignedUrl, setVideoSignedUrl] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [JWTStreamToken, setJWTStreamToken] = useState("");
  const [user, setUser] = useState({
    name: "John Doe",
    email: "john@example.com",
  });

  const fetchToken = async () => {
    try {
      const token = await getToken();
      console.log("Session Token:", token);
      return token;
    } catch (error) {
      console.error("Error fetching token:", error);
    }
  };

  const fetchVideos = async () => {
    try {
      console.log("token : ");
      console.log(await fetchToken());
      const response = await fetch(
        "https://controller3-796253357501.asia-south1.run.app/controller",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${await fetchToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ event: "get-all-videos" }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Fetched videos from server:", data);
      
        // Transform the nested object into an array
        const videoDetails = Object.values(data.files).map((obj) => {
          console.log("Processing video:", obj.fileName);
          return {
            videoName: obj.fileName,
            size: obj.sizeMB * 1024 * 1024, // Convert MB to bytes
            sizeInMB: obj.sizeMB,
            uploadedAt: obj.uploadedAt || null, // Provide fallback for missing fields
            contentType: obj.contentType || "unknown",
            fileId: obj.fileId,
            generation: obj.generation || null, // Provide fallback for missing fields
          };
        });
      
        console.log("Updating state with server-provided videos.");
        setVideoName(videoDetails);
      } else {
        console.error("Failed to fetch videos from server.");
      }
    } catch (e) {
      console.error("Error fetching videos from server:", e);
    }
  };

  const deleteVideoHandler = (vidName,fileId) => {
    console.log("Deleting video:", vidName);

    // Instantly update the UI
    setVideoName((prev) => prev.filter((video) => video.fileId !== fileId));

    // Proceed with the backend call
    console.log(" before Deleting video from server:",sessionToken);
    fetchToken().then(async(sessionToken) => {
      fetch(
        "https://controller3-796253357501.asia-south1.run.app/controller",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${await fetchToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ event: "delete", fileName: fileId }),
        }
      )
        .then((response) => {
          if (response.ok) {
            console.log(`Video successfully deleted from server: ${vidName}`);
          } else {
            console.error(
              "Failed to delete video from server:",
              response.statusText
            );
          }
        })
        .catch((error) => {
          console.error("Error deleting video from server:", error);
        });
    });
  };

  const playVideoHandler = async (fileId) => {
    try {
      console.log("Playing video:", fileId);
  
      // Fetch the signed URL for the video
      const videoResponse = await fetch(
        `https://controller3-796253357501.asia-south1.run.app/stream/${fileId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${await fetchToken()}`, // Ensure fetchToken resolves correctly
            "Content-Type": "application/json",
          },
        }
      );
  
      if (videoResponse.ok) {
        // Parse the JSON response to get the signed URL
        const data = await videoResponse.json();
  
        if (data.signedUrl) {
          console.log("Playing video:", data.signedUrl);
          // Open a new window and embed the video player
          const newWindow = window.open();
          if (newWindow) {
            console.log("Opening video in new window.");
            newWindow.document.write(`
              <html>
                <head>
                  <title>Video Player</title>
                </head>
                <body style="margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #000;">
                  <video controls autoplay style="max-width: 100%; max-height: 100%;">
                    <source src="${data.signedUrl}" type="video/mp4">
                    Your browser does not support the video tag.
                  </video>
                </body>
              </html>
            `);
          } else {
            console.error("Failed to open a new window. It may be blocked by the browser.");
          }
        } else {
          console.error("Signed URL is missing in the response:", data);
        }
      } else {
        console.error(
          "Failed to fetch video:",
          videoResponse.status,
          videoResponse.statusText
        );
      }
    } catch (e) {
      console.error("Error playing video:", e);
    }
  };
  

  useEffect(() => {
    const fetchData = async () => {
      console.log("Fetching JWT token and videos on mount...");
      const sessionToken = await fetchToken();

      const response = await fetch(
        "https://us-central1-controller-445319.cloudfunctions.net/controller-service/controller",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sessionToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ event: "stream" }),
        }
      );

      const data = await response.json();
      console.log("JWT Stream Token:", data.token);
      setJWTStreamToken(data.token);

      fetchVideos();
    };

    fetchData();
  }, []);

  return (
    <div id="video-list-container" className="p-4 min-h-screen">
      {videoName.length === 0 ? ( // Check if the videoName array is empty
        <div className="text-center mt-8">
          <p className="text-gray-700 text-lg font-semibold">
            No Videos Uploaded Yet
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4 justify-center">
          {videoName.map((video) => (
            <div
              key={video.fileId}
              className="bg-gray-100 shadow-[rgba(0,_0,_0,_0.24)_0px_3px_8px] rounded-lg p-4 m-2 text-center w-full md:w-1/4 hover:bg-gray-200 transition-transform transform hover:scale-105 relative"
            >
              <p className="font-semibold text-md text-gray-900 mb-2 truncate">
                {video.videoName}
              </p>
              <button
                onClick={() =>
                  playVideoHandler(video.fileId)
                }
                className="bg-gray-800 text-white px-3 py-1 rounded-full hover:bg-gray-700 transition duration-300 m-1"
              >
                Play
              </button>
              <button
                onClick={() => deleteVideoHandler(video.videoName,video.fileId)}
                className="bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-400 transition duration-300 m-1"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
