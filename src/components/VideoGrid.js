import React, { useState, useEffect } from "react";

export default function VideoGrid({ videos = [], onDeleteVideo }) {
  const [thumbnails, setThumbnails] = useState({});

  useEffect(() => {
    if (Array.isArray(videos)) {
      videos.forEach((video) => {
        if (video?.id && video?.url) {
          generateThumbnail(video.url, video.id);
        }
      });
    }
  }, [videos]);

  const generateThumbnail = (videoUrl, videoId) => {
    const videoElement = document.createElement("video");
    videoElement.src = videoUrl;
    videoElement.crossOrigin = "anonymous"; // Use this if the video is hosted externally
    videoElement.addEventListener("loadeddata", () => {
      videoElement.currentTime = 0; // Seek to the start of the video
      videoElement.addEventListener("seeked", () => {
        const canvas = document.createElement("canvas");
        canvas.width = 300; // Set desired width for the thumbnail
        canvas.height = 200; // Set desired height for the thumbnail
        const ctx = canvas.getContext("2d");
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const thumbnailUrl = canvas.toDataURL("image/png");
        setThumbnails((prev) => ({ ...prev, [videoId]: thumbnailUrl }));
      });
    });
  };

  return (
    <div className="mt-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.isArray(videos) && videos.length > 0 ? (
          videos.map((video) =>
            video?.id ? (
              <div
                key={video.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <img
                  src={thumbnails[video.id] || "placeholder.png"} // Show thumbnail or placeholder
                  alt={video.title || "Video Thumbnail"}
                  className="w-full h-40 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 truncate">
                    {video.title || "Untitled Video"}
                  </h3>
                  <div className="flex justify-between">
                    <button
                      onClick={() => window.open(video.url, "_blank")}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Play
                    </button>
                    <button
                      onClick={() => onDeleteVideo(video.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ) : null
          )
        ) : (
          <p>No videos available.</p>
        )}
      </div>
    </div>
  );
}
