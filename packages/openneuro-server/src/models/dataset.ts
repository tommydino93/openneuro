import mongoose, { Document } from 'mongoose'
const { Schema, model } = mongoose
import DatasetChange from './datasetChange'

// External relations annotating the whole dataset
export interface DatasetRelationDocument extends Document {
  id: string // DOI
  relation: 'sameAs' | 'source' | 'derivative'
  kind: 'Dataset' | 'Article'
  description: string
}

const RelationSchema = new Schema<DatasetRelationDocument>({
  id: { type: String, required: true },
  relation: { type: String, required: true },
  kind: { type: String, required: true },
  description: String,
})

export interface DatasetDocument extends Document {
  id: string
  created: Date
  modified: Date
  public: boolean
  publishDate: Date
  uploader: string
  name: string
  downloads: number
  views: number
  related: [DatasetRelationDocument]
  _conditions: any
}

const datasetSchema = new Schema<DatasetDocument>(
  {
    id: { type: String, unique: true }, // Accession number
    created: { type: Date, default: Date.now },
    modified: { type: Date, default: Date.now },
    public: Boolean,
    publishDate: { type: Date, default: null },
    uploader: String,
    name: String,
    downloads: Number,
    views: Number,
    related: [RelationSchema],
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } },
)

datasetSchema.index({ public: 1 }, { sparse: true })

// Foreign key virtuals for sorting

datasetSchema.virtual('uploadUser', {
  ref: 'User',
  localField: 'uploader',
  foreignField: 'id',
  justOne: true,
})

datasetSchema.virtual('stars', {
  ref: 'Star',
  localField: 'id',
  foreignField: 'datasetId',
  count: true,
  justOne: true,
})

datasetSchema.virtual('subscriptions', {
  ref: 'Subscription',
  localField: 'id',
  foreignField: 'datasetId',
  count: true,
  justOne: true,
})

datasetSchema.post('save', dataset => {
  new DatasetChange({
    datasetId: dataset.id,
    created: true,
  }).save()
})

datasetSchema.post('updateOne', function () {
  const datasetId = this._conditions ? this._conditions.id : null
  new DatasetChange({
    datasetId,
    modified: true,
  }).save()
})

datasetSchema.post('deleteOne', function () {
  const datasetId = this._conditions ? this._conditions.id : null
  new DatasetChange({
    datasetId,
    deleted: true,
  }).save()
})

const Dataset = model<DatasetDocument>('Dataset', datasetSchema)

export default Dataset
