const resources = [
    {
        type: "image",
        title: "Boralex Member",
        src: "https://i.imgur.com/6dzfY3f.jpeg",
    },
    {
        type: "image",
        title: "Boralex Member",
        src: "https://i.imgur.com/i4eRJUb.jpeg",
    },
    {
        type: "image",
        title: "Boralex Member",
        src: "https://i.imgur.com/FxKtgRu.jpeg",
    },

    {
        type: "video",
        title: "Promotional Video",
        src: "https://www.youtube.com/embed/-xWlNeK3NIY",
    },
 
];

function generateResources(category = 'all') {
    const resourceGrid = document.querySelector('.resource-grid');
    resourceGrid.innerHTML = ''; // x

    resources.forEach(resource => {
        if (category === 'all' || resource.type === category) {
            const resourceItem = document.createElement('div');
            resourceItem.className = 'resource-item';

            if (resource.type === "image") {
                resourceItem.innerHTML = `
                    <img src="${resource.src}" alt="${resource.title}" onclick="previewImage('${resource.src}', '${resource.title}')">
                `;
            } else if (resource.type === "video") {
                resourceItem.innerHTML = `
                    <div class="video-container">
                        <iframe src="${resource.src}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                    </div>
                `;
            }

            resourceGrid.appendChild(resourceItem);
        }
    });
}

function filterResources(category) {
    // x
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.filter-btn[onclick="filterResources('${category}')"]`).classList.add('active');

    generateResources(category);
}

function previewImage(src, title) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const captionText = document.getElementById('caption');

    modal.style.display = "block";
    modalImg.src = src;
    captionText.innerHTML = title;

    // x
    modal.onclick = function() {
        modal.style.display = "none";
    }
}

document.addEventListener('DOMContentLoaded', () => generateResources());
