<template>
    <view class="map-controls-wrapper">
        <view class="zoom-controls">
            <view class="zoom-btn" @click="$emit('zoom-in')" title="放大">
                <i class="fas fa-plus"></i>
            </view>
            <view class="zoom-btn" @click="$emit('zoom-out')" title="缩小">
                <i class="fas fa-minus"></i>
            </view>
        </view>

        <view class="layer-toggle-control">
            <view class="layer-btn" @click="$emit('toggle-layer')" title="图层">
                <i class="fas fa-layer-group"></i>
            </view>
        </view>

        <view class="location-control">
            <view class="control-btn" @click="$emit('locate')" title="定位到当前位置">
                <i class="fas fa-location"></i>
            </view>
        </view>
    </view>
</template>

<script>
export default {
    name: 'MapControls'
}
</script>

<style scoped>
.zoom-controls {
    position: absolute;
    top: 80px;
    left: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 1000;
    pointer-events: none;
}

.zoom-controls > * {
    pointer-events: auto;
}

.zoom-btn,
.control-btn {
    background: white;
    border: none;
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 20px;
    color: #333;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
    transition: all .3s ease;
}

.zoom-btn i,
.control-btn i,
.layer-btn i {
    font-family: 'Font Awesome 7 Free';
    font-weight: 900;
    display: inline-block;
    font-style: normal;
    font-variant: normal;
    text-rendering: auto;
    line-height: 1;
}

.zoom-btn:hover,
.control-btn:hover {
    background: #f5f5f5;
    transform: scale(1.05);
}

.location-control {
    position: absolute;
    bottom: 100px;
    right: 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 1000;
    pointer-events: none;
}

.location-control > * {
    pointer-events: auto;
}

.location-control .control-btn {
    width: 44px;
    height: 44px;
    padding: 0;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    border-radius: 10px;
    background: white;
    color: #333;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
}

.layer-toggle-control {
    position: absolute;
    top: 185px;
    left: 10px;
    z-index: 1000;
    pointer-events: none;
}

.layer-toggle-control > * {
    pointer-events: auto;
}

.layer-btn {
    background: white;
    border: none;
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
}

.layer-btn:hover {
    transform: translateY(-2px);
}
</style>