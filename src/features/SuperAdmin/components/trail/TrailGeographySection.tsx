/**
 * @file TrailGeographySection.tsx
 * @description Geography & Coordinates card section for the TrailWrite form.
 * Features MASL elevation, paired Start coordinates (Lat/Long), and paired End coordinates
 * with pixel-perfect vertically centered dividers.
 */

import * as DocumentPicker from 'expo-document-picker';
import { ref, uploadBytes } from 'firebase/storage';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import { Colors, Palette } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { storage } from '@/src/core/config/Firebase';
import { TEdit } from '@/src/core/interface/domainHookInterface';
import { Trail } from '@/src/core/models/Trail/Trail';
import TrailCardHeader from '@/src/features/SuperAdmin/components/trail/TrailCardHeader';
import { getNumericDisplayValue } from '@/src/features/SuperAdmin/utils/trailFormUtils';

export interface TrailGeographySectionProps {
    trail: Trail;
    isEditMode: boolean;
    isComplete: boolean;
    hasError: boolean;
    isDesktop: boolean;
    isMobile: boolean;
    onUpdateField: (params: TEdit<Trail>) => void;
}

const TrailGeographySection: React.FC<TrailGeographySectionProps> = ({
    trail,
    isEditMode,
    isComplete,
    hasError,
    isDesktop,
    isMobile,
    onUpdateField,
}) => {
    const [isUploading, setIsUploading] = useState(false);

    const handlePickAndUploadGeoJson = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/geo+json', 'application/json', '*/*'],
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) {
                return;
            }

            const file = result.assets[0];
            const ext = file.name?.split('.').pop()?.toLowerCase();
            if (ext !== 'geojson' && ext !== 'json') {
                Alert.alert('Invalid File', 'Please select a valid .geojson or .json file.');
                return;
            }

            setIsUploading(true);

            // Read and validate JSON
            const response = await fetch(file.uri);
            const text = await response.text();
            let json: any;
            try {
                json = JSON.parse(text);
            } catch {
                Alert.alert('Invalid GeoJSON', 'The file content is not valid JSON.');
                setIsUploading(false);
                return;
            }

            if (!json || (json.type !== 'FeatureCollection' && json.type !== 'Feature')) {
                Alert.alert('Invalid GeoJSON', 'The file must be a GeoJSON FeatureCollection or Feature.');
                setIsUploading(false);
                return;
            }

            // Derive storage path: trail_routes/<mountain>/<filename>.geojson
            const mountainName = Array.isArray(trail?.general?.mountain)
                ? trail.general.mountain[0]
                : (trail?.general?.mountain || trail?.general?.name || 'custom');
            const mountainSlug = mountainName
                .toLowerCase()
                .trim()
                .replace(/^(mount|mt\.?)\s+/i, '')
                .trim()
                .replace(/[^a-z0-9_-]/g, '_') || 'custom';

            const baseName = file.name
                .toLowerCase()
                .replace(/[^a-z0-9_.-]/g, '_');
            const targetFileName = baseName.endsWith('.geojson')
                ? baseName
                : baseName.endsWith('.json')
                    ? baseName.replace(/\.json$/, '.geojson')
                    : `${baseName}.geojson`;

            const storagePath = `trail_routes/${mountainSlug}/${targetFileName}`;

            // Upload directly to Firebase Storage
            let uploadData: any;
            try {
                uploadData = new Blob([text], { type: 'application/geo+json' });
            } catch {
                uploadData = new TextEncoder().encode(text);
            }
            const fileRef = ref(storage, storagePath);
            await uploadBytes(fileRef, uploadData, { contentType: 'application/geo+json' });

            onUpdateField({ section: 'geography', id: 'geoJsonPath', value: storagePath });

            // Auto-detect Start and End coordinates from GeoJSON if they are not yet populated
            let firstCoord: [number, number] | null = null;
            let lastCoord: [number, number] | null = null;

            const walkCoords = (coords: any) => {
                if (!Array.isArray(coords) || coords.length === 0) return;
                if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
                    if (!firstCoord) firstCoord = [coords[0], coords[1]];
                    lastCoord = [coords[0], coords[1]];
                    return;
                }
                for (const item of coords) {
                    walkCoords(item);
                }
            };

            if (json.type === 'FeatureCollection' && Array.isArray(json.features)) {
                for (const feat of json.features) {
                    if (feat.geometry?.coordinates) walkCoords(feat.geometry.coordinates);
                }
            } else if (json.type === 'Feature' && json.geometry?.coordinates) {
                walkCoords(json.geometry.coordinates);
            }

            if (firstCoord && (!trail?.geography?.startLat || trail?.geography?.startLat === 0)) {
                onUpdateField({ section: 'geography', id: 'startLat', value: (firstCoord[1] as number).toFixed(6) });
                onUpdateField({ section: 'geography', id: 'startLong', value: (firstCoord[0] as number).toFixed(6) });
            }

            if (lastCoord && (!trail?.geography?.endLat || trail?.geography?.endLat === 0)) {
                onUpdateField({ section: 'geography', id: 'endLat', value: (lastCoord[1] as number).toFixed(6) });
                onUpdateField({ section: 'geography', id: 'endLong', value: (lastCoord[0] as number).toFixed(6) });
            }

            Alert.alert(
                'Upload Complete',
                `GeoJSON successfully uploaded to:\n${storagePath}${firstCoord ? '\n\nStart and End coordinates were automatically detected!' : ''}`
            );
        } catch (err: any) {
            console.error('Error uploading GeoJSON to Firebase Storage:', err);
            Alert.alert('Upload Failed', err?.message || 'Could not upload GeoJSON file.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <View style={[styles.sectionCard, { padding: isMobile ? 16 : 24 }]}>
            <TrailCardHeader
                title="Geography & Coordinates"
                subtitle="Elevation MASL, start coordinates, and end coordinates (decimal degrees)"
                iconName="navigation"
                iconLibrary="Feather"
                status={isComplete ? 'ready' : 'required'}
                hasError={hasError}
                isDesktop={isDesktop}
                isMobile={isMobile}
            />

            <View style={styles.cardDivider} />

            <View style={styles.cardBody}>
                {/* 1. Peak Altitude: MASL */}
                <View style={isDesktop ? styles.halfWidthField : styles.fieldBlock}>
                    <CustomTextInput
                        label="MASL (Elevation) *"
                        placeholder="e.g. 811"
                        suffix="m"
                        value={getNumericDisplayValue(trail?.geography?.masl, isEditMode)}
                        onChangeText={(val: string) => onUpdateField({ section: 'geography', id: 'masl', value: val })}
                        type="numerical"
                        keyboardType="number-pad"
                        style={styles.noMarginBottom}
                    />
                </View>

                {/* 2. Start Point Coordinates */}
                <View style={styles.pairedRowContainer}>
                    <View style={styles.pairedFlexCol}>
                        <CustomTextInput
                            label="Start Latitude *"
                            placeholder="e.g. 14.0412"
                            value={getNumericDisplayValue(trail?.geography?.startLat, isEditMode)}
                            onChangeText={(val: string) => onUpdateField({ section: 'geography', id: 'startLat', value: val })}
                            type="coordinate"
                            style={styles.noMarginBottom}
                        />
                        <CustomText variant="caption" style={styles.helperText}>
                            Range: -90 to 90
                        </CustomText>
                    </View>
                    <View style={styles.pairedDividerCol}>
                        <CustomText style={styles.dividerText}>
                            -
                        </CustomText>
                    </View>
                    <View style={styles.pairedFlexCol}>
                        <CustomTextInput
                            label="Start Longitude *"
                            placeholder="e.g. 120.8015"
                            value={getNumericDisplayValue(trail?.geography?.startLong, isEditMode)}
                            onChangeText={(val: string) => onUpdateField({ section: 'geography', id: 'startLong', value: val })}
                            type="coordinate"
                            style={styles.noMarginBottom}
                        />
                        <CustomText variant="caption" style={styles.helperText}>
                            Range: -180 to 180
                        </CustomText>
                    </View>
                </View>

                {/* 3. End Point Coordinates */}
                <View style={styles.pairedRowContainer}>
                    <View style={styles.pairedFlexCol}>
                        <CustomTextInput
                            label="End Latitude *"
                            placeholder="e.g. 14.0485"
                            value={getNumericDisplayValue(trail?.geography?.endLat, isEditMode)}
                            onChangeText={(val: string) => onUpdateField({ section: 'geography', id: 'endLat', value: val })}
                            type="coordinate"
                            style={styles.noMarginBottom}
                        />
                        <CustomText variant="caption" style={styles.helperText}>
                            Range: -90 to 90
                        </CustomText>
                    </View>
                    <View style={styles.pairedDividerCol}>
                        <CustomText style={styles.dividerText}>
                            -
                        </CustomText>
                    </View>
                    <View style={styles.pairedFlexCol}>
                        <CustomTextInput
                            label="End Longitude *"
                            placeholder="e.g. 120.8112"
                            value={getNumericDisplayValue(trail?.geography?.endLong, isEditMode)}
                            onChangeText={(val: string) => onUpdateField({ section: 'geography', id: 'endLong', value: val })}
                            type="coordinate"
                            style={styles.noMarginBottom}
                        />
                        <CustomText variant="caption" style={styles.helperText}>
                            Range: -180 to 180
                        </CustomText>
                    </View>
                </View>

                {/* 4. GeoJSON Trail Route Path & Upload */}
                <View style={styles.geojsonCardContainer}>
                    <View style={styles.geojsonHeaderRow}>
                        <View style={{ flex: 1, minWidth: 200 }}>
                            <CustomText style={styles.geojsonTitle}>Trail Route GeoJSON</CustomText>
                            <CustomText variant="caption" style={styles.helperText}>
                                Upload a `.geojson` route file to host it directly in Firebase Cloud Storage.
                            </CustomText>
                        </View>
                        <TouchableOpacity
                            style={[styles.uploadBtn, isUploading && styles.uploadBtnDisabled]}
                            onPress={handlePickAndUploadGeoJson}
                            disabled={isUploading}
                            activeOpacity={0.8}
                        >
                            {isUploading ? (
                                <ActivityIndicator size="small" color={Colors.WHITE} />
                            ) : (
                                <>
                                    <CustomIcon library="Feather" name="upload-cloud" size={16} color={Colors.WHITE} />
                                    <CustomText style={styles.uploadBtnText}>
                                        {trail?.geography?.geoJsonPath ? 'Replace GeoJSON' : 'Upload GeoJSON'}
                                    </CustomText>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {trail?.geography?.geoJsonPath ? (
                        <View style={styles.uploadedFileBadge}>
                            <CustomIcon library="Feather" name="check-circle" size={16} color={Colors.PRIMARY} />
                            <View style={{ flex: 1 }}>
                                <CustomText style={styles.uploadedFileText} numberOfLines={1}>
                                    {trail.geography.geoJsonPath}
                                </CustomText>
                                <CustomText variant="caption" style={styles.uploadedFileSubtext}>
                                    Hosted in Firebase Storage · Active on maps
                                </CustomText>
                            </View>
                            <TouchableOpacity
                                onPress={() => onUpdateField({ section: 'geography', id: 'geoJsonPath', value: '' })}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <CustomIcon library="Feather" name="x" size={16} color={Colors.GRAY_MEDIUM} />
                            </TouchableOpacity>
                        </View>
                    ) : null}

                    <CustomTextInput
                        label="Storage Path (Manual Override)"
                        placeholder="e.g. trail_routes/pulag/pulag-all.geojson"
                        value={trail?.geography?.geoJsonPath || ''}
                        onChangeText={(val: string) => onUpdateField({ section: 'geography', id: 'geoJsonPath', value: val })}
                        type="text"
                        style={styles.noMarginBottom}
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    sectionCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        ...GlobalStyles.dropShadow(2),
        elevation: 2,
    },
    cardDivider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        marginVertical: 16,
    },
    cardBody: {
        gap: 24,
    },
    fieldBlock: {
        width: '100%',
    },
    halfWidthField: {
        width: '48%',
    },
    noMarginBottom: {
        marginBottom: 0,
    },
    pairedRowContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        width: '100%',
    },
    pairedFlexCol: {
        flex: 1,
    },
    pairedDividerCol: {
        height: 54,
        marginTop: 26,
        paddingHorizontal: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dividerText: {
        fontSize: 20,
        color: Colors.GRAY_MEDIUM,
        fontWeight: '500',
        lineHeight: 22,
        textAlign: 'center',
    },
    helperText: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
        marginTop: 4,
        marginLeft: 2,
    },
    geojsonCardContainer: {
        backgroundColor: Palette.Slate50,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        padding: 16,
        gap: 12,
    },
    geojsonHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
    },
    geojsonTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
    },
    uploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.PRIMARY,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 8,
        gap: 6,
    },
    uploadBtnDisabled: {
        opacity: 0.6,
    },
    uploadBtnText: {
        color: Colors.WHITE,
        fontSize: 13,
        fontWeight: '600',
    },
    uploadedFileBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Palette.Green50,
        borderWidth: 1,
        borderColor: Palette.Green300,
        borderRadius: 8,
        padding: 10,
        gap: 8,
    },
    uploadedFileText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
    },
    uploadedFileSubtext: {
        fontSize: 11,
        color: Colors.PRIMARY,
        marginTop: 2,
    },
});

export default TrailGeographySection;
