# Trail Feature

```
Provide comprehensive hiking trail data, including geographical attributes, difficulty ratings, tourism amenities, weather updates, offline points and maps, and safety guidelines for hikers and businesses.
```

# Feature Functionalities

## Trail Data Management
1. **Geographical & Topographical Information**
   - Location (coordinates: start/end points, address, province, mountain)
   - Elevation & Elevation Gain/Loss (MASL)
   - 3D GeoJSON trail profiles & segments

2. **Difficulty & Technical Specifications**
   - Length, estimated duration (hours)
   - Elevation gain and slope percentage
   - LASCO rating & classification (Minor vs. Major)
   - Circularity (Circuit, Traverse, Out-and-Back)
   - Trail quality and points of difficulty / obstacles

3. **Tourism Infrastructure & Amenities**
   - Shelters, resting areas, viewpoints, info boards
   - Clean water sources, natural landmarks (rivers, lakes, waterfalls, monuments, communities)
   - Mobile network connectivity coverage

4. **Trail Status & Advisories**
   - Trail active/inactive status
   - Closures, hazard warnings, and special announcements
   - Critical notices and maintenance advisories

5. **Weather Information & Safety Guidelines**
   - Live / current weather conditions for mountain locations
   - Safety tips, location-relevant guidelines, and LGU rules & regulations

6. **Offline Access & Navigation Waypoints**
   - Downloadable / cached map data and 3D elevation profiles
   - Offline points of interest (checkpoints, viewpoints, water sources, shelters, summits, hazards)
   - Normalized relative coordinates (x, y percentages) for custom map overlays

7. **Recommendation System Integration**
   - Monthly top-$n$ recommendations and trail discovery feeds

---

### Flows

1. **Trail Discovery & Exploration Flow [Tested, Done]**
   - User opens explore / discover view
   - System fetches active trails (cached or fresh from Firestore)
   - User filters/searches by difficulty, region, or mountain
   - User inspects trail details (MASL, length, duration, amenities, guidelines, weather)

2. **Superadmin Trail Creation & Update Flow [Tested, Done]**
   - Superadmin creates a new trail record
   - Superadmin populates general info, difficulty parameters, and tourism amenities
   - Superadmin uploads or links route maps and defines start/end geographic coordinates
   - System writes trail to database and refreshes global trail cache

3. **Offline Map & Point Caching Flow [Tested]**
   - User loads trail before heading to remote/no-signal areas
   - System persists trail metadata and offline waypoints via local storage
   - When offline, application retrieves stored trail data without network requests

4. **Trail Closure & Advisory Flow [TBI]**
   - Superadmin marks trail status or adds critical notice (e.g. weather hazard, trail repair)
   - Notice immediately updates across Explore, Offer creation, and Navigation tabs

---

## Use Cases

### Superadmin
- Create, update, activate/deactivate, and delete trail records in the central database.
- Configure geographical start/end coordinates and 3D route map geometries.
- Manage offline navigation points (summits, water points, hazards, checkpoints).
- Post trail closures, LGU rules, and safety advisories.

### Admin (Businesses / Organizers)
- Browse verified hiking trails to associate with commercial hiking offers.
- View trail requirements, guidelines, and amenities when designing tour packages.

### Users (Hikers)
- Explore and search available trails with rich filters (difficulty, location, amenities).
- View trail elevation profiles, estimated duration, and tourism infrastructure.
- Access cached trail information and offline waypoints without cellular reception.
- Review local regulations, safety tips, and weather advisories before hiking.

### System
- Index GeoJSON trails and compute length, elevation gain, and elevation loss.
- Cache trail records locally on native devices to enable offline access.
- Filter out non-hiking road segments from topological calculations.

---

## Test Cases

### Superadmin

#### Create/Update
> Do's
1. Superadmins must be able to create new trail records with valid general, difficulty, and tourism data.
2. Superadmins must be able to update any existing trail attributes (e.g., guidelines, safety tips, MASL).
3. Superadmins must be able to add, modify, or remove offline waypoints with percentage-based (x, y) coordinates.
4. Superadmins must be able to set active/inactive status for trail closures.

> Dont's
1. Superadmins must not be able to create trails with duplicate names within the same mountain system.
2. Superadmins must not be able to save invalid start/end geographic coordinates.

#### Read
> Do's
1. Superadmins must be able to view all trail records, including inactive/draft trails.
2. Superadmins must be able to inspect raw topological and GeoJSON stats for any indexed mountain.

> Dont's
1. None.

#### Delete
> Do's
1. Superadmins must be able to delete trail records when no active offers or dependencies exist.

> Dont's
1. Superadmins must not be able to delete trails that are currently linked to active, pending hiking offers.

---

### Admins

#### Read
> Do's
1. Admins must be able to view all active trails to select when creating hiking offers.
2. Admins must be able to read full difficulty, guideline, and tourism information for itinerary preparation.

> Dont's
1. Admins must not be able to modify or delete central trail records.

---

### Users

#### Read & Search
> Do's
1. Users must be able to view all active trails with accurate difficulty, length, and amenity details.
2. Users must be able to view trail guidelines, safety reminders, and LGU regulations.
3. Users must be able to view trail weather and advisories.
4. Users must be able to search and filter trails by mountain, province, or difficulty classification.

> Dont's
1. Users must not be able to view draft or inactive trails.
2. Users must not be able to edit or submit modifications to official trail specifications.

#### Offline Access
> Do's
1. Users must be able to access cached trail data and offline waypoints when the device has no internet connection.

> Dont's
1. Users must not encounter app crashes when offline access is attempted without prior cache.

---

### System

> Do's
1. System must calculate total length, elevation gain, and elevation loss using noise-filtered haversine formulas.
2. System must persist trail collections to AsyncStorage on mobile devices for offline reliability.
3. System must sort trails alphabetically by name upon cache refresh.

> Dont's
1. System must not overwrite locally modified offline points if network sync fails.
