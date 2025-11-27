
"use client"

import { useState, useEffect } from "react"

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalSkills: 0,
    completedCourses: 0,
  })

  // Skills Management State
  const [skills, setSkills] = useState([])
  const [showSkillForm, setShowSkillForm] = useState(false)
  const [editingSkillId, setEditingSkillId] = useState(null)
  const [skillFormData, setSkillFormData] = useState({
    name: "",
    description: "",
    level: "beginner",
    estimatedHours: 10,
    icon: "📚",
    color: "#1230AE",
    tags: "",
  })

  // Modules Management State
  const [modules, setModules] = useState([])
  const [showModuleForm, setShowModuleForm] = useState(false)
  const [editingModuleId, setEditingModuleId] = useState(null)
  const [selectedSkillForModule, setSelectedSkillForModule] = useState("")
  const [moduleFormData, setModuleFormData] = useState({
    title: "",
    description: "",
    estimatedTime: 30,
    type: "lesson",
    lessons: [],
  })

  useEffect(() => {
    fetchStats()
    fetchSkills()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/stats`, {
        credentials: "include",
      })
      const data = await response.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err)
    }
  }

  const fetchSkills = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/skills`, {
        credentials: "include",
      })
      const data = await response.json()
      if (data.success) {
        setSkills(data.skills)
      }
    } catch (err) {
      console.error("Failed to fetch skills:", err)
    }
  }

  const handleSkillFormChange = (e) => {
    const { name, value } = e.target
    setSkillFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSaveSkill = async () => {
    if (!skillFormData.name || !skillFormData.description) {
      alert("Please fill in all required fields")
      return
    }

    const payload = {
      ...skillFormData,
      estimatedHours: parseInt(skillFormData.estimatedHours, 10) || 10,
      tags: skillFormData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0),
    }

    try {
      const url = editingSkillId
        ? `${process.env.REACT_APP_API_URL}/api/admin/skills/${editingSkillId}`
        : `${process.env.REACT_APP_API_URL}/api/admin/skills`

      const method = editingSkillId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Skill save error:", errorData)
        alert("Error: " + (errorData.message || "Failed to save skill"))
        return
      }

      const data = await response.json()
      if (data.success) {
        alert(editingSkillId ? "Skill updated successfully!" : "Skill created successfully!")
        setSkillFormData({
          name: "",
          description: "",
          level: "beginner",
          estimatedHours: 10,
          icon: "📚",
          color: "#1230AE",
          tags: "",
        })
        setShowSkillForm(false)
        setEditingSkillId(null)
        fetchSkills()
      } else {
        alert("Error: " + data.message)
      }
    } catch (err) {
      console.error("Failed to save skill:", err)
      alert("Failed to save skill: " + err.message)
    }
  }

  const handleEditSkill = (skill) => {
    setSkillFormData({
      name: skill.name,
      description: skill.description,
      level: skill.level,
      estimatedHours: skill.estimatedHours,
      icon: skill.icon,
      color: skill.color,
      tags: skill.tags ? skill.tags.join(", ") : "",
    })
    setEditingSkillId(skill._id)
    setShowSkillForm(true)
  }

  const handleDeleteSkill = async (skillId) => {
    if (window.confirm("Are you sure you want to delete this skill and all its modules?")) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/skills/${skillId}`, {
          method: "DELETE",
          credentials: "include",
        })
        const data = await response.json()
        if (data.success) {
          alert("Skill deleted successfully!")
          fetchSkills()
        } else {
          alert("Error: " + data.message)
        }
      } catch (err) {
        alert("Failed to delete skill: " + err.message)
      }
    }
  }

  const handleModuleFormChange = (e) => {
    const { name, value } = e.target
    setModuleFormData((prev) => ({ ...prev, [name]: value }))
  }

  const addLesson = () => {
    const newLesson = {
      id: Date.now() + Math.random(),
      title: `Lesson ${moduleFormData.lessons.length + 1}`,
      type: "lesson",
      content: {
        text: "",
        videoUrl: "",
        quiz: { questions: [] },
        coding: { starterCode: "", language: "javascript", instructions: "" },
      },
    }
    setModuleFormData((prev) => ({ ...prev, lessons: [...prev.lessons, newLesson] }))
  }

  const updateLessonContent = (lessonIndex, field, value) => {
    setModuleFormData((prev) => {
      const newLessons = [...prev.lessons]
      const lesson = newLessons[lessonIndex]
      if (field === "title" || field === "type") {
        lesson[field] = value
      } else if (field === "quiz.questions") {
        lesson.content.quiz.questions = value
      } else if (field.startsWith("coding.")) {
        const subField = field.split(".")[1]
        if (!lesson.content.coding) lesson.content.coding = {}
        lesson.content.coding[subField] = value
      } else {
        lesson.content[field] = value
      }
      return { ...prev, lessons: newLessons }
    })
  }

  const deleteLesson = (lessonIndex) => {
    setModuleFormData((prev) => ({
      ...prev,
      lessons: prev.lessons.filter((_, index) => index !== lessonIndex),
    }))
  }

  const handleSaveModule = async () => {
    const hasEmptyLessonTitle = moduleFormData.lessons.some(lesson => !lesson.title.trim())
    if (hasEmptyLessonTitle) {
      alert("Please fill in titles for all lessons")
      return
    }
    if (!moduleFormData.title || !moduleFormData.description || !selectedSkillForModule || moduleFormData.lessons.length === 0) {
      alert("Please fill in all required fields, select a skill, and add at least one lesson")
      return
    }

    const payload = {
      title: moduleFormData.title.trim(),
      description: moduleFormData.description.trim(),
      estimatedTime: parseInt(moduleFormData.estimatedTime, 10) || 30,
      type: moduleFormData.type,
      lessons: moduleFormData.lessons.map((lesson) => ({
        title: lesson.title.trim(),
        type: lesson.type,
        content: {
          text: lesson.content.text || "",
          videoUrl: lesson.content.videoUrl || "",
          quiz: {
            questions: (lesson.content.quiz?.questions || []).map((q) => ({
              question: q.question || "",
              options: Array.isArray(q.options) ? q.options.filter(o => o.trim()) : [],
              correct: parseInt(q.correct, 10) || 0,
            })).filter(q => q.question.trim()),
          },
          coding: {
            instructions: lesson.content.coding?.instructions || "",
            starterCode: lesson.content.coding?.starterCode || "",
            language: lesson.content.coding?.language || "javascript",
          },
        },
        estimatedTime: parseInt(lesson.estimatedTime || 15, 10),
        order: lesson.order || 1,
      })).filter(lesson => lesson.title),
    }

    if (payload.lessons.length === 0) {
      alert("No valid lessons after sanitization")
      return
    }

    try {
      const url = editingModuleId
        ? `${process.env.REACT_APP_API_URL}/api/admin/skills/${selectedSkillForModule}/modules/${editingModuleId}`
        : `${process.env.REACT_APP_API_URL}/api/admin/skills/${selectedSkillForModule}/modules`

      const method = editingModuleId ? "PUT" : "POST"

      console.log("Sending sanitized payload:", JSON.stringify(payload, null, 2))

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Module save error:", errorData)
        alert(`Error ${response.status}: ${errorData.message || "Failed to save module. Check console."}`)
        return
      }

      const data = await response.json()
      if (data.success) {
        alert(editingModuleId ? "Module updated successfully!" : "Module created successfully!")
        setModuleFormData({
          title: "",
          description: "",
          estimatedTime: 30,
          type: "lesson",
          lessons: [],
        })
        setShowModuleForm(false)
        setEditingModuleId(null)
        setSelectedSkillForModule("")
        fetchSkills()
      } else {
        alert("Error: " + data.message)
      }
    } catch (err) {
      console.error("Failed to save module:", err)
      alert("Failed to save module: " + err.message)
    }
  }

  const handleEditModule = (skill, module) => {
    setModuleFormData({
      title: module.title,
      description: module.description,
      estimatedTime: module.estimatedTime,
      type: module.type,
      lessons: module.lessons || [],
    })
    setEditingModuleId(module._id)
    setSelectedSkillForModule(skill._id)
    setShowModuleForm(true)
  }

  const handleDeleteModule = async (skillId, moduleId) => {
    if (window.confirm("Are you sure you want to delete this module?")) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/skills/${skillId}/modules/${moduleId}`, {
          method: "DELETE",
          credentials: "include",
        })
        const data = await response.json()
        if (data.success) {
          alert("Module deleted successfully!")
          fetchSkills()
        } else {
          alert("Error: " + data.message)
        }
      } catch (err) {
        alert("Failed to delete module: " + err.message)
      }
    }
  }

  const renderOverview = () => (
    <div style={{ display: "grid", gap: "2rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
        {[
          { key: "totalUsers", label: "Total Users", color: "#0066FF", icon: "👥" },
          { key: "activeUsers", label: "Active Users", color: "#10B981", icon: "✨" },
          { key: "totalSkills", label: "Total Skills", color: "#F59E0B", icon: "🎯" },
          { key: "completedCourses", label: "Completed Courses", color: "#FF6B6B", icon: "🏆" },
        ].map((stat) => (
          <div key={stat.key} className="stat-card" style={{
            background: "white",
            padding: "2rem",
            borderRadius: "20px",
            border: "2px solid rgba(0, 102, 255, 0.1)",
            transition: "all 0.3s ease",
            cursor: "pointer",
            position: "relative",
            overflow: "hidden"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-8px)"
            e.currentTarget.style.borderColor = stat.color
            e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 102, 255, 0.16)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)"
            e.currentTarget.style.borderColor = "rgba(0, 102, 255, 0.1)"
            e.currentTarget.style.boxShadow = "none"
          }}>
            <div style={{
              position: "absolute",
              top: "-20px",
              right: "-20px",
              width: "100px",
              height: "100px",
              background: `linear-gradient(135deg, ${stat.color}22, transparent)`,
              borderRadius: "50%"
            }}></div>
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>{stat.icon}</div>
            <h3 style={{ color: stat.color, fontSize: "2.5rem", fontWeight: "800", marginBottom: "0.5rem" }}>
              {stats[stat.key].toLocaleString()}
            </h3>
            <p style={{ color: "#6B7280", fontWeight: "600", fontSize: "1rem" }}>{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  )

  const renderSkillsManagement = () => (
    <div style={{ display: "grid", gap: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <h2 style={{ 
          fontSize: "2.5rem", 
          fontWeight: "800", 
          background: "linear-gradient(135deg, #0066FF, #FF6B6B)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text"
        }}>
          Skills Management
        </h2>
        <button
          className="btn-toggle"
          onClick={() => {
            setShowSkillForm(!showSkillForm)
            setEditingSkillId(null)
            setSkillFormData({
              name: "",
              description: "",
              level: "beginner",
              estimatedHours: 10,
              icon: "📚",
              color: "#1230AE",
              tags: "",
            })
          }}
          style={{
            padding: "1rem 2rem",
            background: showSkillForm ? "#6B7280" : "linear-gradient(135deg, #0066FF, #FF6B6B)",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "1rem",
            fontWeight: "700",
            cursor: "pointer",
            transition: "all 0.3s ease",
            boxShadow: "0 4px 16px rgba(0, 102, 255, 0.3)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)"
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 102, 255, 0.4)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)"
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 102, 255, 0.3)"
          }}
        >
          {showSkillForm ? "✕ Cancel" : "+ Add New Skill"}
        </button>
      </div>

      {showSkillForm && (
        <div className="form-card" style={{
          background: "white",
          padding: "2.5rem",
          borderRadius: "24px",
          border: "2px solid rgba(0, 102, 255, 0.1)",
          boxShadow: "0 4px 16px rgba(0, 102, 255, 0.12)"
        }}>
          <h3 style={{ 
            marginBottom: "2rem", 
            fontSize: "1.8rem",
            fontWeight: "700",
            color: "#1A1A2E"
          }}>
            {editingSkillId ? "✏️ Edit Skill" : "✨ Create New Skill"}
          </h3>
          <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "1fr 1fr" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="form-label" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#1A1A2E" }}>
                Skill Name *
              </label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={skillFormData.name}
                onChange={handleSkillFormChange}
                placeholder="e.g., React Basics"
                style={{
                  width: "100%",
                  padding: "1rem",
                  border: "2px solid rgba(0, 102, 255, 0.2)",
                  borderRadius: "12px",
                  fontSize: "1rem",
                  transition: "all 0.3s ease",
                  outline: "none"
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#0066FF"
                  e.currentTarget.style.boxShadow = "0 0 0 4px rgba(0, 102, 255, 0.1)"
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0, 102, 255, 0.2)"
                  e.currentTarget.style.boxShadow = "none"
                }}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label className="form-label" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#1A1A2E" }}>
                Description *
              </label>
              <textarea
                name="description"
                className="form-input"
                value={skillFormData.description}
                onChange={handleSkillFormChange}
                placeholder="Describe your skill"
                style={{
                  width: "100%",
                  padding: "1rem",
                  border: "2px solid rgba(0, 102, 255, 0.2)",
                  borderRadius: "12px",
                  fontSize: "1rem",
                  minHeight: "120px",
                  resize: "vertical",
                  transition: "all 0.3s ease",
                  outline: "none",
                  fontFamily: "inherit"
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#0066FF"
                  e.currentTarget.style.boxShadow = "0 0 0 4px rgba(0, 102, 255, 0.1)"
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0, 102, 255, 0.2)"
                  e.currentTarget.style.boxShadow = "none"
                }}
              />
            </div>

            <div>
              <label className="form-label" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#1A1A2E" }}>
                Level
              </label>
              <select
                name="level"
                className="form-input"
                value={skillFormData.level}
                onChange={handleSkillFormChange}
                style={{
                  width: "100%",
                  padding: "1rem",
                  border: "2px solid rgba(0, 102, 255, 0.2)",
                  borderRadius: "12px",
                  fontSize: "1rem",
                  cursor: "pointer",
                  outline: "none",
                  background: "white"
                }}
              >
                <option value="beginner">🌱 Beginner</option>
                <option value="intermediate">🚀 Intermediate</option>
                <option value="advanced">⭐ Advanced</option>
              </select>
            </div>

            <div>
              <label className="form-label" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#1A1A2E" }}>
                Estimated Hours
              </label>
              <input
                type="number"
                name="estimatedHours"
                className="form-input"
                value={skillFormData.estimatedHours}
                onChange={handleSkillFormChange}
                min="1"
                style={{
                  width: "100%",
                  padding: "1rem",
                  border: "2px solid rgba(0, 102, 255, 0.2)",
                  borderRadius: "12px",
                  fontSize: "1rem",
                  outline: "none"
                }}
              />
            </div>

            <div>
              <label className="form-label" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#1A1A2E" }}>
                Icon (Emoji)
              </label>
              <input
                type="text"
                name="icon"
                className="form-input"
                value={skillFormData.icon}
                onChange={handleSkillFormChange}
                placeholder="e.g., 📚"
                style={{
                  width: "100%",
                  padding: "1rem",
                  border: "2px solid rgba(0, 102, 255, 0.2)",
                  borderRadius: "12px",
                  fontSize: "1rem",
                  outline: "none"
                }}
              />
            </div>

            <div>
              <label className="form-label" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#1A1A2E" }}>
                Color (Hex)
              </label>
              <input
                type="text"
                name="color"
                className="form-input"
                value={skillFormData.color}
                onChange={handleSkillFormChange}
                placeholder="e.g., #0066FF"
                style={{
                  width: "100%",
                  padding: "1rem",
                  border: "2px solid rgba(0, 102, 255, 0.2)",
                  borderRadius: "12px",
                  fontSize: "1rem",
                  outline: "none"
                }}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label className="form-label" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#1A1A2E" }}>
                Tags (comma-separated)
              </label>
              <input
                type="text"
                name="tags"
                className="form-input"
                value={skillFormData.tags}
                onChange={handleSkillFormChange}
                placeholder="e.g., React, JavaScript, Frontend"
                style={{
                  width: "100%",
                  padding: "1rem",
                  border: "2px solid rgba(0, 102, 255, 0.2)",
                  borderRadius: "12px",
                  fontSize: "1rem",
                  outline: "none"
                }}
              />
            </div>

            <button
              className="btn-submit"
              onClick={handleSaveSkill}
              style={{
                gridColumn: "1 / -1",
                marginTop: "1rem",
                padding: "1.25rem 2rem",
                background: "linear-gradient(135deg, #0066FF, #FF6B6B)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "1.1rem",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 16px rgba(0, 102, 255, 0.3)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)"
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 102, 255, 0.4)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 102, 255, 0.3)"
              }}
            >
              {editingSkillId ? "💾 Update Skill" : "✨ Create Skill"}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
        {skills && skills.length > 0 ? (
          skills.map((skill) => (
            <div
              key={skill._id}
              className="skill-card"
              style={{
                background: "white",
                padding: "2rem",
                borderRadius: "20px",
                border: "2px solid rgba(0, 102, 255, 0.1)",
                transition: "all 0.3s ease",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)"
                e.currentTarget.style.borderColor = skill.color
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 102, 255, 0.16)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.borderColor = "rgba(0, 102, 255, 0.1)"
                e.currentTarget.style.boxShadow = "none"
              }}
            >
              <div style={{
                position: "absolute",
                top: "-30px",
                right: "-30px",
                width: "120px",
                height: "120px",
                background: `linear-gradient(135deg, ${skill.color}22, transparent)`,
                borderRadius: "50%"
              }}></div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem", position: "relative", zIndex: 1 }}>
                <div>
                  <h3 style={{ color: "#1A1A2E", marginBottom: "0.5rem", fontSize: "1.4rem", fontWeight: "700" }}>
                    {skill.name}
                  </h3>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                    {skill.tags?.map((tag, idx) => (
                      <span key={idx} style={{
                        padding: "0.25rem 0.75rem",
                        background: `${skill.color}15`,
                        color: skill.color,
                        borderRadius: "20px",
                        fontSize: "0.75rem",
                        fontWeight: "600"
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <span style={{ fontSize: "2.5rem" }}>{skill.icon}</span>
              </div>

              <p style={{ color: "#6B7280", fontSize: "0.95rem", marginBottom: "1.5rem", lineHeight: "1.6" }}>
                {skill.description}
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.5rem", padding: "1rem", background: "#F8F9FF", borderRadius: "12px" }}>
                <div>
                  <p style={{ fontSize: "0.8rem", color: "#6B7280", marginBottom: "0.25rem" }}>Level</p>
                  <p style={{ fontWeight: "700", color: "#1A1A2E", textTransform: "capitalize" }}>{skill.level}</p>
                </div>
                <div>
                  <p style={{ fontSize: "0.8rem", color: "#6B7280", marginBottom: "0.25rem" }}>Hours</p>
                  <p style={{ fontWeight: "700", color: "#1A1A2E" }}>{skill.estimatedHours}h</p>
                </div>
                <div>
                  <p style={{ fontSize: "0.8rem", color: "#6B7280", marginBottom: "0.25rem" }}>Modules</p>
                  <p style={{ fontWeight: "700", color: "#1A1A2E" }}>{skill.modules?.length || 0}</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  className="btn-edit"
                  onClick={() => handleEditSkill(skill)}
                  style={{
                 
                       padding: "0.5rem 1.5rem",   // shorter & wider
                    background: "white",
                    color: skill.color,
                    border: `2px solid ${skill.color}`,
                    borderRadius: "10px",
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.3s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = skill.color
                    e.currentTarget.style.color = "white"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "white"
                    e.currentTarget.style.color = skill.color
                  }}
                >
                  ✏️ Edit
                </button>
                <button
                  className="btn-delete"
                  onClick={() => handleDeleteSkill(skill._id)}
                  style={{
                    flex: 1,
                    padding: "0.875rem",
                    background: "linear-gradient(135deg, #FF6B6B, #FF5252)",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.3s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)"
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "4rem 2rem",
              background: "white",
              borderRadius: "20px",
              border: "2px dashed rgba(0, 102, 255, 0.2)",
            }}
          >
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎯</div>
            <h3 style={{ fontSize: "1.5rem", marginBottom: "0.5rem", color: "#1A1A2E" }}>No skills yet</h3>
            <p style={{ color: "#6B7280" }}>Create your first skill to get started!</p>
          </div>
        )}
      </div>
    </div>
  )

  const renderModulesManagement = () => (
    <div style={{ display: "grid", gap: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ color: "var(--primary)" }}>Modules Management</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowModuleForm(!showModuleForm)
            setEditingModuleId(null)
            setModuleFormData({
              title: "",
              description: "",
              estimatedTime: 30,
              type: "lesson",
              lessons: [],  // Reset
            })
            setSelectedSkillForModule("")
          }}
        >
          {showModuleForm ? "Cancel" : "+ Add New Module"}
        </button>
      </div>

      {showModuleForm && (
        <div className="card" style={{ background: "var(--muted)", padding: "2rem", borderRadius: "var(--radius)" }}>
          <h3 style={{ marginBottom: "1.5rem", color: "var(--primary)" }}>
            {editingModuleId ? "Edit Module" : "Create New Module"}
          </h3>
          <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "1fr" }}>
            <div className="form-group">
              <label className="form-label">Select Skill *</label>
              <select
                className="form-input"
                value={selectedSkillForModule}
                onChange={(e) => setSelectedSkillForModule(e.target.value)}
                disabled={!!editingModuleId}
              >
                <option value="">Select a skill</option>
                {skills.map((skill) => (
                  <option key={skill._id} value={skill._id}>
                    {skill.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Module Title *</label>
              <input
                type="text"
                name="title"
                className="form-input"
                value={moduleFormData.title}
                onChange={handleModuleFormChange}
                placeholder="e.g., Introduction to React"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea
                name="description"
                className="form-input"
                value={moduleFormData.description}
                onChange={handleModuleFormChange}
                placeholder="Overall module description"
                style={{ minHeight: "100px" }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Type</label>
              <select name="type" className="form-input" value={moduleFormData.type} onChange={handleModuleFormChange}>
                <option value="lesson">Lesson</option>
                <option value="project">Project</option>
                <option value="quiz">Quiz</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Estimated Time (minutes)</label>
              <input
                type="number"
                name="estimatedTime"
                className="form-input"
                value={moduleFormData.estimatedTime}
                onChange={handleModuleFormChange}
                min="1"
              />
            </div>

            {/* NEW: Lessons Section */}
            <div className="form-group">
              <label className="form-label">Lessons (Add lesson-by-lesson content)</label>
              <button className="btn btn-secondary" onClick={addLesson} style={{ marginBottom: "1rem" }}>
                + Add Lesson
              </button>
              {moduleFormData.lessons.length === 0 && (
                <p style={{ color: "var(--muted-foreground)", fontSize: "0.9rem" }}>No lessons yet. Add one to start!</p>
              )}
              {moduleFormData.lessons.map((lesson, index) => (
                <div key={lesson._id} style={{ background: "var(--background)", padding: "1rem", borderRadius: "var(--radius)", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <h4 style={{ margin: 0, color: "var(--primary)" }}>Lesson {index + 1}: {lesson.title}</h4>
                    <button className="btn btn-outline" onClick={() => deleteLesson(index)} style={{ fontSize: "0.8rem" }}>
                      Delete
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Lesson title"
                    value={lesson.title}
                    onChange={(e) => updateLessonContent(index, "title", e.target.value)}
                    style={{ width: "100%", marginBottom: "0.5rem" }}
                  />
                  <select
                    value={lesson.type}
                    onChange={(e) => updateLessonContent(index, "type", e.target.value)}
                    style={{ width: "100%", marginBottom: "0.5rem" }}
                  >
                    <option value="lesson">Text Lesson</option>
                    <option value="video">Video Lesson</option>
                    <option value="quiz">Quiz</option>
                    <option value="coding">Coding Challenge</option>
                  </select>

                  {/* Type-specific fields */}
                  {lesson.type === "lesson" || lesson.type === "video" ? (
                    <>
                      <textarea
                        placeholder="Text content (Markdown/HTML supported)"
                        value={lesson.content.text}
                        onChange={(e) => updateLessonContent(index, "text", e.target.value)}
                        style={{ width: "100%", minHeight: "80px", marginBottom: "0.5rem" }}
                      />
                      <input
                        type="url"
                        placeholder="Video URL (e.g., YouTube embed)"
                        value={lesson.content.videoUrl}
                        onChange={(e) => updateLessonContent(index, "videoUrl", e.target.value)}
                        style={{ width: "100%" }}
                      />
                    </>
                  ) : lesson.type === "quiz" ? (
                    <div>
                      <p style={{ fontSize: "0.9rem", color: "var(--muted-foreground)" }}>Quiz Questions:</p>
                      {lesson.content.quiz.questions.map((q, qIndex) => (
                        <div key={qIndex} style={{ marginBottom: "0.5rem", padding: "0.5rem", border: "1px solid var(--border)" }}>
                          <input
                            placeholder="Question"
                            value={q.question}
                            onChange={(e) => {
                              const newQuestions = [...lesson.content.quiz.questions]
                              newQuestions[qIndex].question = e.target.value
                              updateLessonContent(index, "quiz.questions", newQuestions)
                            }}
                          />
                          <input
                            placeholder="Options (comma-separated)"
                            value={q.options.join(', ')}
                            onChange={(e) => {
                              const newQuestions = [...lesson.content.quiz.questions]
                              newQuestions[qIndex].options = e.target.value.split(',').map(o => o.trim())
                              updateLessonContent(index, "quiz.questions", newQuestions)
                            }}
                          />
                          <input
                            type="number"
                            placeholder="Correct option index (0-based)"
                            value={q.correct}
                            onChange={(e) => {
                              const newQuestions = [...lesson.content.quiz.questions]
                              newQuestions[qIndex].correct = parseInt(e.target.value)
                              updateLessonContent(index, "quiz.questions", newQuestions)
                            }}
                            min="0"
                          />
                        </div>
                      ))}
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          const newQuestions = [...lesson.content.quiz.questions, { question: "", options: [], correct: 0 }]
                          updateLessonContent(index, "quiz.questions", newQuestions)
                        }}
                        style={{ fontSize: "0.8rem" }}
                      >
                        + Add Question
                      </button>
                    </div>
                  ) : lesson.type === "coding" ? (
                    <>
    <textarea
      placeholder="Instructions"
      value={lesson.content.coding.instructions || ""}
      onChange={(e) => updateLessonContent(index, "coding.instructions", e.target.value)}
      style={{ width: "100%", minHeight: "60px", marginBottom: "0.5rem" }}
    />
    <textarea  // CHANGED: textarea for code
      placeholder="Starter Code"
      value={lesson.content.coding.starterCode || ""}
      onChange={(e) => updateLessonContent(index, "coding.starterCode", e.target.value)}
      style={{ width: "100%", minHeight: "100px", marginBottom: "0.5rem" }}
    />
    <input
      type="text"
      placeholder="Language (e.g., javascript)"
      value={lesson.content.coding.language || "javascript"}
      onChange={(e) => updateLessonContent(index, "coding.language", e.target.value)}
      style={{ width: "100%", marginTop: "0.5rem" }}
    />
  </>
                  ): null}
                </div>
              ))}
            </div>

            <button className="btn btn-primary" onClick={handleSaveModule} style={{ marginTop: "1rem" }}>
              {editingModuleId ? "Update Module" : "Create Module"}
            </button>
          </div>
        </div>
      )}

      {/* Existing modules list (ENHANCED: Now shows lessons count/preview) */}
      <div style={{ display: "grid", gap: "2rem" }}>
        {skills && skills.length > 0 ? (
          skills.map((skill) => (
            <div key={skill._id} className="card">
              <h3 style={{ color: "var(--primary)", marginBottom: "1rem" }}>{skill.name}</h3>
              {skill.modules && skill.modules.length > 0 ? (
                <div style={{ display: "grid", gap: "1rem" }}>
                  {skill.modules.map((module) => (
                    <div
                      key={module._id}
                      style={{
                        padding: "1rem",
                        background: "var(--muted)",
                        borderRadius: "var(--radius)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: "600", marginBottom: "0.25rem" }}>{module.title}</p>
                        <p style={{ fontSize: "0.9rem", color: "var(--muted-foreground)", margin: "0" }}>
                          {module.description}
                        </p>
                        <p style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", marginTop: "0.5rem" }}>
                          Est. Time: {module.estimatedTime} min | Type: {module.type} | Lessons: {module.lessons?.length || 0}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          className="btn btn-outline"
                          onClick={() => handleEditModule(skill, module)}
                          style={{ fontSize: "0.9rem" }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleDeleteModule(skill._id, module._id)}
                          style={{ fontSize: "0.9rem" }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "var(--muted-foreground)" }}>No modules in this skill yet.</p>
              )}
            </div>
          ))
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "2rem",
              background: "var(--muted)",
              borderRadius: "var(--radius)",
            }}
          >
            <p style={{ color: "var(--muted-foreground)" }}>Create a skill first before adding modules.</p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #F8F9FF 0%, #FFFFFF 100%)",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0066FF 0%, #FF6B6B 100%)",
        padding: "2rem 0",
        boxShadow: "0 4px 16px rgba(0, 102, 255, 0.2)",
        position: "sticky",
        top: 0,
        zIndex: 100
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 0rem" }}>
          <h1 style={{
            color: "white",
            fontSize: "2.5rem",
            fontWeight: "800",
            
            margin: 0
          }}>
            ⚡ Admin Dashboard
          </h1>
          <p style={{ color: "rgba(255,255,255,0.9)", marginTop: "0.5rem", fontSize: "1.1rem" }}>
            Manage your platform with ease
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ background: "white", borderBottom: "2px solid rgba(0, 102, 255, 0.1)", position: "sticky", top: "120px", zIndex: 99 }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 2rem", display: "flex", gap: "2rem" }}>
          {[
            { id: "overview", label: "📊 Overview" },
            { id: "skills", label: "🎯 Skills" },
            { id: "modules", label: "📚 Modules" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "1.5rem 2rem",
                background: "transparent",
                color: activeTab === tab.id ? "#0066FF" : "#6B7280",
                border: "none",
                borderBottom: activeTab === tab.id ? "3px solid #0066FF" : "3px solid transparent",
                fontSize: "1.05rem",
                fontWeight: activeTab === tab.id ? "700" : "600",
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = "#0066FF"
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = "#6B7280"
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "3rem 2rem" }}>
        {activeTab === "overview" && renderOverview()}
        {activeTab === "skills" && renderSkillsManagement()}
        {activeTab === "modules" && renderModulesManagement(
          // <div style={{ textAlign: "center", padding: "4rem", color: "#6B7280" }}>
          //   <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📚</div>
          //   <h3 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Modules Management</h3>
          //   <p>Ready for the modules section...</p>
          // </div>
        )}
      </div>
    </div>
  )


  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "skills", label: "Skills", icon: "📚" },
    { id: "modules", label: "Modules", icon: "🎓" },
  ]

  if (user?.role !== "admin") {
    return (
      <div className="container" style={{ padding: "2rem 0", textAlign: "center" }}>
        <h1>Access Denied</h1>
        <p>You don't have permission to access the admin dashboard.</p>
      </div>
    )
  }

  return (
    <div className="admin-dashboard" style={{ padding: "2rem 0" }}>
      <div className="container">
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ color: "var(--primary)", marginBottom: "0.5rem" }}>Admin Dashboard</h1>
          <p style={{ color: "var(--muted-foreground)" }}>Manage your learning platform and monitor performance.</p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: "2rem",
            borderBottom: "1px solid var(--border)",
            overflowX: "auto",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "1rem 1.5rem",
                border: "none",
                background: "none",
                color: activeTab === tab.id ? "var(--primary)" : "var(--muted-foreground)",
                borderBottom: activeTab === tab.id ? "2px solid var(--primary)" : "2px solid transparent",
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontSize: "1rem",
                fontWeight: activeTab === tab.id ? "600" : "400",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div>
          {activeTab === "overview" && renderOverview()}
          {activeTab === "skills" && renderSkillsManagement()}
          {activeTab === "modules" && renderModulesManagement()}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard