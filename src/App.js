import React, { useState, useEffect, useRef } from "react";
import Tesseract from "tesseract.js";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import "bootstrap/dist/css/bootstrap.css";
import "./App.css";

function App() {
  // State tanımlamaları
  const [images, setImages] = useState([]); // Resimlerin listesi
  const [textOutput, setTextOutput] = useState(""); // Tanımlanan metin çıktısı
  const [language, setLanguage] = useState("eng"); // Dil seçimi
  const fileInputRef = useRef(null); // Dosya girişi için referans

  // Resim veya dil değiştiğinde metin çıktısını güncelleyen useEffect
  useEffect(() => {
    updateTextOutput();
  }, [images, language]);

  // Resimleri sürükleyip bırakma işlemi sonunda çalışan fonksiyon
  const handleDrop = (result) => {
    if (!result.destination) return;
    const updatedImages = [...images];
    const [reorderedImage] = updatedImages.splice(result.source.index, 1);
    updatedImages.splice(result.destination.index, 0, reorderedImage);
    setImages(updatedImages);
  };

  // Dosya seçme işlemi sonunda çalışan fonksiyon
  const handleInputChange = (event) => {
    loadImages(event.target.files);
  };

  // Seçilen dosyaları yükleyen fonksiyon
  const loadImages = async (files) => {
    const loadedImages = await Promise.all(
      Array.from(files).map(async (file) => {
        const imageUrl = URL.createObjectURL(file);
        const imageText = await recognizeText(imageUrl);
        return { url: imageUrl, text: imageText };
      })
    );
    setImages((prevImages) => [...prevImages, ...loadedImages]);
  };

  // OCR (optik karakter tanıma) işlemi yapan fonksiyon
  const recognizeText = async (imageData) => {
    const { data } = await Tesseract.recognize(imageData, language);
    return data.text;
  };

  // Resmi listeden silen fonksiyon
  const handleDeleteImage = (index) => {
    const updatedImages = [...images];
    updatedImages.splice(index, 1);
    setImages(updatedImages);
  };

  // Metin çıktısını güncelleyen fonksiyon
  const updateTextOutput = async () => {
    const imageTexts = await Promise.all(
      images.map((image) => recognizeText(image.url))
    );
    setTextOutput(imageTexts.join("\n\n"));
  };

  // Resimleri sürükleyip bırakma işlemi için tıklama fonksiyoni
  const handleDragDropClick = () => {
    fileInputRef.current.click();
  };

  // Yapıştırma işlemi (Ctrl+V) sonunda çalışan fonksiyon
  const handlePaste = async (event) => {
    event.preventDefault();
    const clipboardData = event.clipboardData || window.clipboardData;
    const items = clipboardData.items;

    for (const item of items) {
      if (item.type.indexOf("image") !== -1) {
        const blob = item.getAsFile();
        const imageUrl = URL.createObjectURL(blob);
        const imageText = await recognizeText(imageUrl);
        setImages((prevImages) => [
          ...prevImages,
          { url: imageUrl, text: imageText },
        ]);
      }
    }

    updateTextOutput();
  };

  // Sürükleyip bırakma işlemi için gerekli olay dinleyicileri ekle
  useEffect(() => {
    const handleDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDropFile = (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        loadImages(e.dataTransfer.files);
      }
    };

    const dragDropArea = document.querySelector(".drag-drop-area");

    dragDropArea.addEventListener("dragenter", handleDragEnter);
    dragDropArea.addEventListener("dragover", handleDragOver);
    dragDropArea.addEventListener("dragleave", handleDragLeave);
    dragDropArea.addEventListener("drop", handleDropFile);

    return () => {
      dragDropArea.removeEventListener("dragenter", handleDragEnter);
      dragDropArea.removeEventListener("dragover", handleDragOver);
      dragDropArea.removeEventListener("dragleave", handleDragLeave);
      dragDropArea.removeEventListener("drop", handleDropFile);
    };
  }, []);

  // JSX içeriği
  return (
    <div className="container mt-5" onPaste={handlePaste}>
      <div className="row">
        <div className="col-md-11 offset-md-1">
          <h3 className="mb-3" style={{ textAlign: "center" }}>
            Image to Text
          </h3>
          <div
            className="drag-drop-area mb-3"
            onDragOver={(e) => e.preventDefault()}
            onClick={handleDragDropClick}
            tabIndex="0"
          >
            Paste copied image, click to choose a file or drag and drop images
            here
          </div>
          <input
            type="file"
            id="imageInput"
            className="form-control d-none"
            multiple
            onChange={handleInputChange}
            ref={fileInputRef}
          />
          <DragDropContext onDragEnd={handleDrop}>
            <Droppable droppableId="image-list" direction="horizontal">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="sortable"
                  id="sortableContainer"
                >
                  {images.map((image, index) => (
                    <Draggable
                      key={index}
                      draggableId={`image-${index}`}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="image-container"
                        >
                          <img
                            src={image.url}
                            alt={`Image ${index}`}
                            className="img-fluid image-preview"
                          />
                          <span
                            className="delete-button"
                            onClick={() => handleDeleteImage(index)}
                          >
                            ×
                          </span>
                        </div>
                      )}
                    </Draggable>
                  ))}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          <textarea
            id="textOutput"
            rows="10"
            className="form-control"
            value={textOutput}
            readOnly
          ></textarea>
          <div className="language-select-container">
            <label htmlFor="languageSelect">Select Language:</label>
            <select
              id="languageSelect"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="eng">English</option>
              <option value="tur">Turkish</option>
              <option value="deu">German</option>
              <option value="jpn">Japanese</option>
              <option value="fra">French</option>
              <option value="spa">Spanish</option>
              <option value="ita">Italian</option>
              <option value="por">Portuguese</option>
              <option value="rus">Russian</option>
              <option value="kor">Korean</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;