// Document ready event listener
document.addEventListener('DOMContentLoaded', function() {
  // Function to handle file uploads
  handleFileUpload();

  // Event listener for the back button
  document.getElementById('backButton').addEventListener('click', function() {
    window.history.back();
  });

  // Function to fetch and display files from the S3 bucket
  fetchAndDisplayFiles();
});

// Handles file uploads
function handleFileUpload() {
  const uploadButton = document.getElementById('uploadButton');
  uploadButton.addEventListener('click', function() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (!file) {
      alert('Please select a file to upload.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = function(event) {
      const base64Content = event.target.result.split(',')[1]; // Get the base64 content part
      const payload = {
        fileName: file.name,
        fileContent: base64Content,
      };

      fetch('/.netlify/functions/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log('Success:', data);
        alert('File uploaded successfully.');
        fetchAndDisplayFiles();  // Refresh the file list after a successful upload
      })
      .catch((error) => {
        console.error('Error:', error);
        alert('Upload failed.');
      });
    };
    reader.readAsDataURL(file);
  });
}

function fetchAndDisplayFiles() {
  const fileListElement = document.getElementById('pdfList');
  fetch('/.netlify/functions/listfiles')
    .then(response => response.json())
    .then(files => {
      const items = files.map(file => `
        <li>
          ${file.key}
          <a href="${file.url}" target="_blank">Download</a>
          <button onclick="deleteFile('${file.key}')">Delete</button>
        </li>
      `).join("");
      fileListElement.innerHTML = items;
    })
    .catch(error => console.error('Error loading the files:', error));
}

function deleteFile(fileName) {
  fetch('/.netlify/functions/deletefile', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName })
  })
  .then(response => response.json())
  .then(data => {
    alert(data.message);  // Show a success/failure message
    fetchAndDisplayFiles();  // Refresh the file list
  })
  .catch(error => {
    console.error('Error deleting the file:', error);
    alert('Failed to delete the file.');
  });
}



