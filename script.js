document.addEventListener("DOMContentLoaded", () => {
    // Fetch and display the initial movie list from the backend API
    fetch("http://localhost:3000/films")
        .then(response => response.json())
        .then(movies => {
            populateMovieMenu(movies); // shows all the movies that are in the menu
            if (movies.length > 0) {
                displayMovieDetails(movies[0]); // Display the first movie by default when loaded or reloaded
            }
        });

    // Add new movies
    const addMovieForm = document.getElementById("add-movie-form");
    addMovieForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const newMovie = {
            title: event.target.title.value, //the movie title
            runtime: parseInt(event.target.runtime.value), ///the time in minutes
            showtime: event.target.showtime.value, // takes the showtime
            capacity: parseInt(event.target.capacity.value), // takes the amount of people needed to fill
            tickets_sold: 0,
            poster: event.target.poster.value, //the url for the movie poster
        };

        // Send a POST request to add the new movie to the backend and populates it
        fetch("http://localhost:3000/films", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(newMovie),
        })
            .then(response => response.json())
            .then(addedMovie => {
                populateMovieMenu([addedMovie]); // Add new movie to the menu dynamically
                addMovieForm.reset(); // Reset the form
                alert("Movie added successfully yaay!");
            });
    });

    // search functionality
    const searchBar = document.getElementById("search-bar");
    searchBar.addEventListener("input", (event) => {
        const query = event.target.value.toLowerCase();
        const movies = Array.from(document.querySelectorAll(".film.item"));
        movies.forEach(movie => {
            const title = movie.textContent.toLowerCase();
            movie.style.display = title.includes(query) ? "" : "none";
        });
    });
});

//adds movies to the list of movies
function populateMovieMenu(movies) {
    const filmList = document.getElementById("films");
    movies.forEach(movie => {
        const existingMovie = document.querySelector(`li[data-id="${movie.id}"]`);
        if (existingMovie) return; // Prevent duplicates that is similar movies

        const li = document.createElement("li");
        li.textContent = movie.title;
        li.className = "film item";
        li.setAttribute("data-id", movie.id);

        const availableTickets = movie.capacity - movie.tickets_sold;
        if (availableTickets === 0) {
            li.classList.add("sold-out");
        }

        // Event listener to display movie details
        li.addEventListener("click", () => {
            fetch(`http://localhost:3000/films/${movie.id}`)
                .then(response => response.json())
                .then(data => {
                    displayMovieDetails(data); //show detailed information for the selected movie
                });
        });

        // Add delete button to enable users delete movies nolonger in use
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-btn";
        deleteButton.addEventListener("click", (event) => {
            event.stopPropagation();
            fetch(`http://localhost:3000/films/${movie.id}`, {
                method: "DELETE",
            }).then(response => {
                if (response.ok) {
                    li.remove();
                    alert("Movie deleted successfully!");
                }
            });
        });

        li.appendChild(deleteButton);
        filmList.appendChild(li);
    });
}

function displayMovieDetails(movie) {
    const poster = document.getElementById("poster");
    const title = document.getElementById("title");
    const runtime = document.getElementById("runtime");
    const showtime = document.getElementById("showtime");
    const tickets = document.getElementById("tickets");
    const buyButton = document.getElementById("buy-ticket");

    // Update movie details
    poster.src = movie.poster;
    title.textContent = movie.title;
    runtime.textContent = `Runtime: ${movie.runtime} minutes`;
    showtime.textContent = `Showtime: ${movie.showtime}`;
    const availableTickets = movie.capacity - movie.tickets_sold;
    tickets.textContent = `Available Tickets: ${availableTickets}`;

    // Update Buy Ticket button if there are available buttons
    if (availableTickets > 0) {
        buyButton.textContent = "Buy Ticket";
        buyButton.disabled = false;
    } else {
        buyButton.textContent = "Sold Out";
        buyButton.disabled = true;
    }

    // Remove old event listener to prevent duplication
    const newBuyButton = buyButton.cloneNode(true);
    buyButton.replaceWith(newBuyButton);

    // Add event listener to Buy Ticket button to enable effect when users click the button
    newBuyButton.addEventListener("click", () => {
        if (availableTickets > 0) {
            const newTicketsSold = movie.tickets_sold + 1; //indicates an increase in movies sold

            // Update tickets in the frontend
            tickets.textContent = `Available Tickets: ${availableTickets - 1}`;
            movie.tickets_sold = newTicketsSold;

            // Update tickets in the database db.json
            fetch(`http://localhost:3000/films/${movie.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ tickets_sold: newTicketsSold }),
            })
                .then(response => response.json())
                .then(updatedMovie => {
                    if (updatedMovie.capacity - updatedMovie.tickets_sold === 0) {
                        tickets.textContent = "Available Tickets: 0";
                        newBuyButton.textContent = "Sold Out";
                        newBuyButton.disabled = true;

                        // indicate that the movie is sold out in the menu list
                        const soldOutItem = document.querySelector(`li[data-id="${movie.id}"]`);
                        soldOutItem.classList.add("sold-out");
                    }
                });
        } else {
            alert("Sorry, this movie is sold out!"); //alert to show that the movie is sold out
        }
    });
}
