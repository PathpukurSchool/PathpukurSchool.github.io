
document.addEventListener("DOMContentLoaded", function () {
    fetch("config.json")
        .then(response => response.json())
        .then(data => {
            const uniqueClasses = new Set();
            const buttonContainer = document.getElementById("class-buttons");

            data.forEach(item => {
                if (!uniqueClasses.has(item.Class)) {
                    uniqueClasses.add(item.Class);

                    const button = document.createElement("button");
                    button.textContent = `CLASS ${item.Class}`;
                    button.className = "class-button";

                    button.onclick = function () {
                        alert(`You selected CLASS ${item.Class}`);
                    };

                    buttonContainer.appendChild(button);
                }
            });
        })
        .catch(error => console.error("Error loading config.json:", error));
});
