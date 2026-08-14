import {Component, computed, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SigridData} from '../services/sigrid-data';
import {SigridConfiguration} from '../services/sigrid-configuration';
import {VsCode} from '../services/vs-code';

interface MetadataField {
  key: string;
  displayValue: string;
}

interface MetadataSection {
  title: string;
  fields: MetadataField[];
}

@Component({
  selector: 'app-metadata',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metadata.html',
  styleUrl: './metadata.scss',
})
export class Metadata implements OnInit {
  private sigridData = inject(SigridData);
  private configuration = inject(SigridConfiguration);
  private vsCode = inject(VsCode);

  private readonly sectionMapping: Record<string, string[]> = {
    'General': ['systemName', 'displayName', 'divisionName', 'teamNames', 'supplierNames', 'remark'],
    'Status': ['status', 'excluded_from_dashboards'],
    'External Reference': ['externalID', 'externalDisplayName'],
    'Metadata': ['in_production_since', 'businessCriticality', 'lifecyclePhase', 'targetIndustry', 'deploymentType', 'applicationType', 'softwareDistributionStrategy'],
  };

  protected metadata = computed(() => this.sigridData.metadata());
  protected isLoading = computed(() => this.sigridData.isRefreshing());

  protected groupedMetadata = computed(() => {
    const meta = this.metadata();
    if (!meta || meta.error || !meta.data) return [];

    const allFields = Object.entries(meta.data).reduce((acc, [key, value]) => {
      acc[key] = this.formatValue(value);
      return acc;
    }, {} as Record<string, string>);

    const sections: MetadataSection[] = [];
    const usedKeys = new Set<string>();

    Object.entries(this.sectionMapping).forEach(([sectionTitle, fieldNames]) => {
      const sectionFields: MetadataField[] = [];
      fieldNames.forEach(fieldName => {
        if (fieldName in allFields) {
          sectionFields.push({
            key: this.humanizeFieldName(fieldName),
            displayValue: allFields[fieldName],
          });
          usedKeys.add(fieldName);
        }
      });
      if (sectionFields.length > 0) {
        sections.push({ title: sectionTitle, fields: sectionFields });
      }
    });

    const otherFields: MetadataField[] = Object.entries(allFields)
      .filter(([key]) => !usedKeys.has(key))
      .map(([key, value]) => ({
        key: this.humanizeFieldName(key),
        displayValue: value,
      }));

    if (otherFields.length > 0) {
      sections.push({ title: 'Other', fields: otherFields });
    }

    return sections;
  });

  ngOnInit() {
    this.sigridData.loadMetadata();
  }

  protected onEditMetadata() {
    const config = this.configuration.getConfiguration()();
    if (config) {
      const editUrl = `https://sigrid-says.com/${config.customer}/${config.system}/-/settings/metadata`;
      this.vsCode.openUrl(editUrl);
    }
  }

  protected getErrorMessage(): string {
    const meta = this.metadata();
    return meta?.error || 'Error loading metadata';
  }

  private formatValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '—';
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  private humanizeFieldName(field: string): string {
    return field
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
