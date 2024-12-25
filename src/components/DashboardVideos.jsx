import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";

export default function DashboardVideos() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [videoName, setVideoName] = useState([]);
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
      console.log("Fetching videos from the server...");
      const sessionToken = await fetchToken();
      const response = await fetch(
        "https://us-central1-controller-445319.cloudfunctions.net/controller-service/controller",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sessionToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ event: "get-all-videos" }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Fetched videos from server:", data);

        const videoDetails = data.objects.map((obj) => {
          const parts = obj.name.split("/");
          console.log("Processing video:", obj.name);
          return {
            videoName: parts[1],
            size: obj.size,
            sizeInMB: obj.sizeInMB,
            uploadedAt: obj.uploadedAt,
            contentType: obj.contentType,
            fileId: obj.fileId,
            generation: obj.generation,
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

  const deleteVideoHandler = (vidName) => {
    console.log("Deleting video:", vidName);

    // Instantly update the UI
    setVideoName((prev) => prev.filter((video) => video.videoName !== vidName));

    // Proceed with the backend call
    fetchToken().then((sessionToken) => {
      fetch(
        "https://us-central1-controller-445319.cloudfunctions.net/controller-service/controller",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sessionToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ event: "delete", fileName: vidName }),
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

  const playVideoHandler = async (vidName, genID) => {
    try {
      console.log("Playing video:", vidName);
      const videoResponse = await fetch(
        `https://storage-service-796253357501.us-central1.run.app/stream-video/${vidName}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${JWTStreamToken}`,
          },
        }
      );

      if (videoResponse.ok) {
        const videoBlob = await videoResponse.blob();
        const videoUrl = URL.createObjectURL(videoBlob);
        console.log("Video URL generated:", videoUrl);

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
                  <source src="${videoUrl}" type="video/mp4">
                  Your browser does not support the video tag.
                </video>
              </body>
            </html>
          `);
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
              key={video.videoName}
              className="bg-gray-100 shadow-[rgba(0,_0,_0,_0.24)_0px_3px_8px] rounded-lg p-4 m-2 text-center w-full md:w-1/4 hover:bg-gray-200 transition-transform transform hover:scale-105 relative"
            >
              <p className="font-semibold text-md text-gray-900 mb-2 truncate">
                {video.videoName}
              </p>
              <button
                onClick={() =>
                  playVideoHandler(video.videoName, video.generation)
                }
                className="bg-gray-800 text-white px-3 py-1 rounded-full hover:bg-gray-700 transition duration-300 m-1"
              >
                Play
              </button>
              <button
                onClick={() => deleteVideoHandler(video.videoName)}
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
