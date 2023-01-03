'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const sidebar = document.querySelector('.sidebar');
class Workout {
  clicks = 0;
  date = new Date();
  id = Date.now() + ''.slice(-10);
  constructor(coords, distance, duration) {
    // this.date =

    this.coords = coords; //[long , lat]
    this.distance = distance; // km
    this.duration = duration; // min
    // this._setDescriptipon();
  }

  _setDescriptipon() {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
    // console.log(this.description);
  }
  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;

    this.calcPace();
    this._setDescriptipon();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescriptipon();
  }

  calcSpeed() {
    // km / hr
    this.speed = this.distance / (this.duration / 60);

    return this.speed;
  }
}

// const run = new Running([39, -12], 5.2, 24, 178);
// const Cycle = new Cycling([39, -12], 27, 95, 523);
// console.log(run, Cycle);

////////////////////////////////////////////////

// App Architechture
class App {
  #map;
  #mapEvent;
  #workouts = [];
  zoomLevel = 13;
  constructor() {
    this._getPosition();

    this._getLocalStorage();
    form.addEventListener('submit', this._newWorkout.bind(this));

    containerWorkouts.addEventListener('click', this._movePopup.bind(this));
    // Change cycling to running

    inputType.addEventListener('change', this._toggleElevationField.bind(this));
  }

  // Geting the position
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        this._errorMessage
      );
    }
  }

  // Error message
  _errorMessage() {
    alert("Couldn't get your position");
  }

  //loadiing the map
  _loadMap(position) {
    const { latitude } = position.coords;
    const longitude = position.coords.longitude;
    // console.log(latitude, longitude);
    // console.log(`https://www.google.com/maps/@${latitude},3.3718272,12z`);

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => {
      // this._renderWorkout(work);
      this._renderWorkoutMarker(work);
    });
  }
  _showForm(mapE) {
    sidebar.classList.add('show');
    sidebar.classList.remove('hide');
    this.#mapEvent = mapE;

    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputElevation.value =
      inputCadence.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => {
      form.style.display = 'grid';
    }, 1000);
  }

  _toggleElevationField(e) {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    // console.log(e);
  }
  _newWorkout(e) {
    e.preventDefault();
    // Get data from form
    sidebar.classList.remove('show');
    sidebar.classList.add('hide');
    const validInput = (...inputs) =>
      inputs.every(input => Number.isFinite(input));
    const allPositive = function (...inputs) {
      return inputs.every(input => input > 0);
    };

    const type = inputType.value;
    const distance = Number(inputDistance.value);
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If the workout is running, create a cycling object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // Check if it is valid
      if (
        !validInput(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Input have to be positive number');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If the workout is cycling, create a running object
    if (type === 'cycling') {
      // Check if it is valid
      const elevation = +inputElevation.value;

      if (
        !validInput(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Input have to be positive number');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    //  Add a new object to the workout array
    this.#workouts.push(workout);

    // Render workout
    this._renderWorkoutMarker(workout);

    // Render workout list
    this._renderWorkout(workout);

    // Clear input fields
    this._hideForm();

    // Local storage

    this._setLocalStorage();
    // Display marker
  }
  _renderWorkoutMarker(workout) {
    // console.log(workout);
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }
  _renderWorkout(workout) {
    // const dateMonth = new Date().getMonth();
    // const dateDay = new Date().getDate();

    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃' : '🚴‍♀️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;
    if (workout.type === 'running') {
      html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;
    }
    if (workout.type === 'cycling') {
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevationGain}</span>
      <span class="workout__unit">m</span>
    </div>
  </li>`;
    }
    form.insertAdjacentHTML('afterend', html);
  }
  _movePopup(e) {
    const workoutEl = e.target.closest('.workout');

    // Guard clause
    if (!workoutEl) return;

    const workout = this.#workouts.find(
      workout => workout.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.zoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
    // workout.click();
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    // console.log(data);

    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
      // this._renderWorkoutMarker(work);
    });
  }
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
