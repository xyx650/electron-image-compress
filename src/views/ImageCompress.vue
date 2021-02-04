<template>
  <div class="tinypng-wrapper">
    <div class="tips">
      <p>1. 只能压缩 <span class="highlight">jpg/png</span> 格式图片；</p>
      <p>2. 一次最多压缩<span class="highlight">100张</span>；</p>
      <p>3. 压缩后的文件会保存在<span class="highlight">最后一张图片路径下的image-compress文件夹</span>中, 请留意成功后的提示；</p>
      <p>4. image-compress文件夹中如果有同名文件，将被<span class="highlight">覆盖</span>；</p>
      <p>5. 图片处理需要时间，点击压缩后请耐心等待片刻。</p>
    </div>
    
    <div class="slider-wrapper">
      <span class="label">压缩质量</span>
      <el-slider
        class="slider"
        v-model="quality"
        :min="10"
      />
    </div>
    
    <div class="header">
      <el-input placeholder="保存文件目录" v-model="targetDir" disabled>
        <template #prepend>图片保存目录</template>
      </el-input>
      <el-button style="margin-left: 24px" type="success" @click="handleSubmit">开始压缩</el-button>
    </div>
    
    <div class="tinypng-content">
      <el-upload
        class="upload-demo"
        ref="uploadRef"
        accept=".jpg,.png"
        multiple
        :auto-upload="false"
        :limit="maxFileNum"
        :file-list="fileList"
        :before-upload="beforeUpload"
        :on-exceed="handleExceed"
        :on-change="handleChangeFile"
        action=""
        list-type="picture-card"
      >
        <i class="el-icon-plus" />
      </el-upload>
    </div>
  </div>
</template>

<script>
import { defineComponent, onMounted, onBeforeUnmount, reactive, toRefs } from 'vue'
// electron ipcRenderer -- 与electron主进程通信
// import { ipcRenderer } from 'electron'
const { ipcRenderer } = window.require('electron')
// import path from 'path'
const path = window.require('path')
import { ElMessage, ElNotification, ElLoading } from 'element-plus'

// loading 实例
let loadingInstance = null
export default defineComponent({
  name: 'ImageCompress',
  setup() {
    const data = reactive({
      fileList: [],// 文件列表
      maxFileNum: 100, // 批量处理文件数量限制
      uploadRef: null, // 图片选择组件
      targetDir: null, // 图片保存的目标目录
      quality: 50 // 图片压缩质量
    })
    
    // 文件选择数量超出设定值时，弹出警告框
    const handleExceed = (files, fileList) => ElMessage.warning({
      message: `最多只能选择 ${data.maxFileNum}个文件哦，当前选择了 ${files.length + fileList.length} 个文件`,
      type: 'warning'
    })
    
    // 文件改变事件,设置文件保存目录为当前目录下的image-compress文件夹，没有会创建，有同名文件会覆盖
    const handleChangeFile = file => {
      console.log(path)
      const parseUrl = path.parse(file.raw.path)
      data.targetDir = parseUrl.dir + `${path.sep}image-compress`
    }
    
    // 确认按钮，开始压缩
    const handleSubmit = () => {
      const uploadFiles = data.uploadRef.uploadFiles
      // 验证是否选择了图片，没有选择弹出警告信息
      if (!uploadFiles.length) {
        ElNotification({
          title: '警告',
          message: '请先选择文件！',
          type: 'warning'
        })
        return false
      }
      
      const dir = path.normalize(data.targetDir)
      // 遍历出图片文件的路径
      const fileList = []
      uploadFiles.map(item => item?.raw?.path && fileList.push(item.raw.path))
      // 消息参数
      const DATA = {
        fileList,
        quality: data.quality,
        targetDir: dir
      }
      // 显示loading
      loadingInstance = ElLoading.service({
        background: 'rgba(255, 255, 255, .5)'
      })
      // 向主进程发送消息，消息中有：压缩质量、压缩保存目录、压缩文件的地址（数组）
      ipcRenderer.send('compress-image', DATA)
    }
    
    onBeforeUnmount(() => loadingInstance = null)
    
    onMounted(() => {
      // 响应主进程推送的图片压缩状态，并弹框显示
      ipcRenderer.on('compress-status', (event, arg) => {
        console.log('响应主进程推送的图片压缩状态，并弹框显示', arg)
        ElNotification({
          title: arg.success ? '成功' : '失败',
          message: arg.success ? arg.msg : arg.reason,
          type: arg.success ? 'success' : 'error'
        })
        loadingInstance.close()
        if (arg.success) {
          data.fileList = []
          data.quality = 50
          data.targetDir = null
        }
      })
    })
    
    return {
      ...toRefs(data),
      handleExceed,
      handleChangeFile,
      handleSubmit
    }
  }
})
</script>

<style scoped lang="scss">
.tinypng-wrapper {

  padding: 20px;

  .tips {
    padding: 20px;
    color: #999;
    font-size: 14px;
    line-height: 1.2;

    .highlight {
      color: brown;
    }
  }

  .slider-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;

    .label {
      padding-right: 20px;
    }

    .slider {
      flex: 1;
    }
  }

  .header {
    display: flex;
    margin: 10px auto;

  }

  .tinypng-content {
    margin-top: 20px;

    .upload-demo {
      :deep(.el-upload--picture-card),
      :deep(.el-upload-list__item) {
        width: 80px;
        height: 80px;
        line-height: 78px;

        img {
          object-fit: cover;
          object-position: center;
        }
      }
    }
  }
}
</style>