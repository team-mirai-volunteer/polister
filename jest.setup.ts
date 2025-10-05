import "@testing-library/jest-dom";

jest.mock("mapbox-gl", () => {
  class MapStub {
    addControl() {
      return this;
    }

    remove() {
      return undefined;
    }

    on() {
      return this;
    }

    off() {
      return this;
    }

    once(_event: string, handler: () => void) {
      handler();
      return this;
    }

    setStyle() {
      return this;
    }

    isStyleLoaded() {
      return true;
    }

    getLayer() {
      return true;
    }

    setPaintProperty() {
      return this;
    }

    setLayoutProperty() {
      return this;
    }
  }

  class GeolocateControlStub {
    trigger() {
      return undefined;
    }
  }

  class NavigationControlStub {}

  const mapboxgl = {
    Map: MapStub,
    GeolocateControl: GeolocateControlStub,
    NavigationControl: NavigationControlStub,
    supported: () => true,
    accessToken: "",
  };

  return {
    __esModule: true,
    default: mapboxgl,
  };
});
